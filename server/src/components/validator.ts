import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { CompiledData } from './compiler';
import { Index } from './indexer';
import { TypeDefinition } from './schema';
import { DD2CSVMMDSettings } from '../../../shared/settings';
import { logPerformanceTime } from '../../../shared/utils';

export function validateAstBySchema(
	ast: AST,
	compiledData: CompiledData,
	astIndex: Index,
	configuration: DD2CSVMMDSettings
): Diagnostic[] {
	if (!configuration.validateElementTypes &&
		!configuration.validateFieldNames &&
		!configuration.validateFieldInput
	) {
		return [];
	}
	const t0 = performance.now();
	const diagnostics: Diagnostic[] = [];
	for (const element of ast) {
		if (element.elementType === "KingdomMap") {
			continue;
		}
		if (!compiledData.elementsDescription[element.elementType]) {
			if (configuration.validateElementTypes) {
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: element.elementTypeRange,
					message: `Unrecognized element type "${element.elementType}"`
				});
			}
			continue;
		}
		const elementDefinition = compiledData.schema[element.elementType];
		for (const field of element.fields) {
			if (!field.name) {
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				if (configuration.validateFieldNames) {
					diagnostics.push({
						severity: DiagnosticSeverity.Error,
						range: field.range,
						message: `Unrecognized field name "${field.name}"`
					});
				}
				continue;
			}
			if (configuration.validateFieldInput) {
				if (field.values.length === 0) {
					if (configuration.showEmptyFields) {
						diagnostics.push({
							severity: DiagnosticSeverity.Warning,
							range: field.range,
							message: `Empty field`
						});
					}
				}
				else {
					const diagnostic = validateInput(element, field, field.values, fieldDefinition.input, compiledData, astIndex);
					diagnostic && diagnostics.push(diagnostic);
				}
			}
		}
	}
	
	logPerformanceTime("Validation", t0);
	return diagnostics;
}

/**
 * Validates values against the provided type definition.
 * @param values List of values to validate. These values might differ from field.values because this function is called recursively for groups of values.
 * @param astIndex Index of values encountered in non-vanilla data.
 * @returns One diagnostic object for the first error encountered.
 */
function validateInput(element: ASTElement, field: ASTField, values: ASTValue[],
	definition: TypeDefinition, compiledData: CompiledData, astIndex: Index): Diagnostic | null {
	switch (definition.type) {
		case "any":
			return null;

		case "bool":
			return singleValueCheck(field, values, definition, isBoolString);

		case "int":
			return singleValueCheck(field, values, definition, isIntegerString);

		case "range":
			return singleValueCheck(field, values, definition, isRangeString);
	
		case "float":
			return singleValueCheck(field, values, definition, isNumericString);

		case "nothing":
			for (const v of values) {
				if (v.text) {
					return createExpectedEndOfInputDiagnostic(values);
				}
			}
			return null;

		case "list":
			if (definition.element.type === "sequence") {
				const listElementNumberOfValues = definition.element.elements.length;
				for (let i = 0; i < values.length; i += listElementNumberOfValues) {
					if (i + listElementNumberOfValues > values.length) {
						createMissingSequenceValueDiagnostic(field, values.slice(i), definition.element);
					}
					const valuesSlice = values.slice(i, i + listElementNumberOfValues);
					const diagnostic = validateInput(element, field, valuesSlice, definition.element, compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
				}
			}
			else {
				for (const v of values) {
					if (!v.text.trim()) {
						continue;
					}
					const diagnostic = validateInput(element, field, [v], definition.element, compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
				}
			}
			return null;

		case "sequence":
			let listInSequence = false;
			for (let i = 0; i < definition.elements.length; i++) {
				if (i >= values.length) {
					return createMissingSequenceValueDiagnostic(field, values, definition);
				}
				if (definition.elements[i].type === "list") {
					listInSequence = true;
					const diagnostic = validateInput(element, field, values.slice(i), definition.elements[i], compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
					break;
				}
				else {
					const diagnostic = validateInput(element, field, [values[i]], definition.elements[i], compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
				}
			}
			if (!listInSequence && (values.length > definition.elements.length)) {
				return createExpectedEndOfInputDiagnostic(values.slice(definition.elements.length));
			}
			return null;

		case "union":
			if (values.length === 0) {
				return createExpectedTypeDiagnostic(definition, field.range);
			}
			else {
				let matchesAnyOption = false;
				for (const optionType of definition.elements) {
					const diagnostic = validateInput(element, field, values, optionType, compiledData, astIndex);
					if (!diagnostic) {
						matchesAnyOption = true;
						break;
					}
				}
				if (!matchesAnyOption) {
					return createExpectedTypeDiagnostic(definition, values[0].range);
				}
				return null;
			}

		case "id":
			return singleRefCheck(field, values, definition,
				astIndex.idGroups[definition.group], compiledData.index.idGroups[definition.group]);

		case "tagEmitter":
			return null;

		case "tagReceiver":
			return singleRefCheck(field, values, definition,
				astIndex.tagGroups[definition.group], compiledData.index.tagGroups[definition.group]);

		case "kw":
			const keywords = compiledData.keywords[definition.group];
			if (!keywords) {
				console.error(`Unrecognized KW group ${definition.group}`);
				return null;
			}
			return singleRefCheck(field, values, definition, Object.keys(keywords), undefined);

		case "dependentRequired":
		case "dependent":
			const influencedFieldDefinition = definition;
			const influenceSourceField = element.fields.find(f => f.name === influencedFieldDefinition.field);
			if (!influenceSourceField) {
				return {
					severity: DiagnosticSeverity.Error,
					range: field.range,
					message: `Missing required field ${influencedFieldDefinition.field}.`,
				};
			}
			const influenceSourceSchema = compiledData.schema[element.elementType].fields[influenceSourceField.name].input;
			const influenceSourceSchemaContent = influenceSourceSchema.type === "list" ? influenceSourceSchema.element : influenceSourceSchema;
			if (influenceSourceSchemaContent.type !== "kw") {
				console.error(`Influence field ${field.name} in element ${element.name} is not a KW or List(KW) field.`);
				return null;
			}
			if ((field.values.length) && (influenceSourceField.values.length === 0)) {
				return {
					severity: DiagnosticSeverity.Error,
					range: field.range,
					message: `Field-influencer ${influenceSourceField.name} is empty.`,
				};
			}
			if ((influenceSourceSchema.type === "list")) {
				if ((definition.type === "dependentRequired") && (influenceSourceField.values.length != field.values.length)
					|| (definition.type === "dependent") && (influenceSourceField.values.length < field.values.length))
				return {
					severity: DiagnosticSeverity.Error,
					range: field.range,
					message: `Field-influencer ${influenceSourceField.name} has a different number of values (${influenceSourceField.values.length}) than this field (${field.values.length}).`,
				};
			}
			const influenceKWGroup = compiledData.keywords[influenceSourceSchemaContent.group];
			if (!influenceKWGroup) {
				console.error(`Unrecognized dependency group ${influenceSourceSchemaContent.group}`);
				return null;
			}
			if (influenceSourceField.values[0].text === "actor_stat_value") {
				return validateConditionStringForActorStatValue(element, field, compiledData, astIndex);
			}
			for (let i = 0; i < influenceSourceField.values.length; i++) {
				if (i >= field.values.length) {
					return null;
				}
				const sourceValue = influenceSourceField.values[i];
				const influenceValueDesc = influenceKWGroup[sourceValue.text];
				if (!influenceValueDesc) {
					console.error(`Dependency of field ${field.name} by value ${sourceValue.text} is not found.`);
					return null;
				}
				const influenceType = influenceValueDesc.influences?.[element.elementType + " " + field.name];
				if (!influenceType) {
					console.error(`Dependency of field ${field.name} by value ${sourceValue.text} is empty.`);
					return null;
				}
				const valuesToValidate = influenceSourceSchema.type === "list" ? field.values.slice(i, i + 1) : field.values;
				if ((definition.type === "dependentRequired") && (valuesToValidate.some(v => !v.text.trim()))) {
					return createExpectedTypeDiagnostic(influenceType.input, field.values[i].range);
				}
				const validationResult = validateInput(element, field, valuesToValidate, influenceType.input, compiledData, astIndex);
				if (validationResult) {
					return validationResult;
				}
			}
			return null;

		case 'sub':
			if (values.length !== 3) {
				return {
					severity: DiagnosticSeverity.Error,
					range: field.range,
					message: `Three values are required`,
				};
			}
			const groupValidateResult = validateInput(element, field, [values[0]], { type: "kw", group: definition.group }, compiledData, astIndex);
			if (groupValidateResult) {
				return groupValidateResult;
			}
			const KWGroup = compiledData.keywords[definition.group];
			if (!KWGroup) {
				console.error(`Unrecognized subtype group ${definition.group}`);
				return null;
			}
			const valueDesc = KWGroup[values[0].text];
			if (!valueDesc) {
				console.error(`Subtype group ${definition.group} has no ${values[0].text}.`);
				return null;
			}
			const derivedType = valueDesc.influences?.[definition.subtypeString];
			if (!derivedType) {
				console.error(`Subtype ${definition.subtypeString} has empty fields.`);
				return null;
			}
			const subtypeValidateResult = validateInput(element, field, [values[1]], derivedType.input, compiledData, astIndex);
			if (subtypeValidateResult) {
				return subtypeValidateResult;
			}
			return validateInput(element, field, [values[2]], definition.subtypeValueType, compiledData, astIndex);

		default:
			console.error(`Unknown input type: ${definition}`);
			return null;
	}
}


const isBoolString = (str: string) => (str === "True") || (str === "False");

const isIntegerStringRegex = /^-?\d+$/;
const isIntegerString = (str: string) => isIntegerStringRegex.test(str);

const isNumericString = (str: string) => !isNaN(Number(str));

const isRangeStringRegex = /^\[\d+-\d+\]$/;
const isRangeString = (str: string) =>isRangeStringRegex.test(str);

function singleValueCheck(field: ASTField, values: ASTValue[], type: TypeDefinition, checker: (v: string) => boolean): Diagnostic | null {
	if (values.length === 0) {
		return null;
	}
	else {
		const content = values[0].text;
		if (!checker(content)) {
			return createExpectedTypeDiagnostic(type, values[0].range);
		}
		if (values.length > 1) {
			return createExpectedEndOfInputDiagnostic(values.slice(1));
		}
		return null;
	}
}

function singleRefCheck(
	field: ASTField,
	values: ASTValue[],
	referenceType: TypeDefinition,
	astIndexGroupEntries?: string[],
	compiledDataGroupEntries?: string[]
): Diagnostic | null {
	if (values.length === 0) {
		return null;
	}
	else {
		if (isCondition(referenceType)) {
			let idx = 0;
			for (const id of values[0].text.split("+")) {
				if (id === "") {
					continue;
				}
				if (!isValueInGroupEntries(id, astIndexGroupEntries, compiledDataGroupEntries)) {
					const line = values[0].range.start.line;
					const charStart = values[0].range.start.character;
					const range: Range = {
						start: { line, character: charStart + idx },
						end: { line, character: charStart + idx + id.length },
					};
					return createMissingGroupMemberDiagnostic(id, referenceType, range);
				}
				idx += id.length + 1;
			}
			if (values.length > 1) {
				return createExpectedEndOfInputDiagnostic(values.slice(1));
			}
			return null;
		}
		if (isValueInGroupEntries(values[0].text, astIndexGroupEntries, compiledDataGroupEntries)) {
			if (values.length > 1) {
				return createExpectedEndOfInputDiagnostic(values.slice(1));
			}
			return null;
		}
		return createMissingGroupMemberDiagnostic(values[0].text, referenceType, values[0].range);
	}
}

function isValueInGroupEntries(value: string, astIndexGroupEntries?: string[], compiledDataGroupEntries?: string[]): boolean {
	const inMod = astIndexGroupEntries?.includes(value);
	if (inMod) {
		return true;
	}
	else {
		const inVanilla = compiledDataGroupEntries?.includes(value);
		if (inVanilla) {
			return true;
		}
	}
	return false;
}

function isCondition(referenceType: TypeDefinition) {
	return ((referenceType.type === "id") && (referenceType.group === "Condition"))
}

function createMissingGroupMemberDiagnostic(value: string, expectedType: TypeDefinition, range: Range) {
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Unrecognized value "${value}".\nExpected value of type:\n${typeToVerbose(expectedType)}`,
	};
}

function createExpectedTypeDiagnostic(expectedType: TypeDefinition, range: Range): Diagnostic {
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Expected type:\n${typeToVerbose(expectedType)}`
	};
}

function createExpectedEndOfInputDiagnostic(values: ASTValue[]): Diagnostic | null {
	if (!values.length) {
		return null;
	}
	const range = Range.create(
		{ line: values[0].range.start.line, character: values[0].range.start.character },
		{ line: values[0].range.end.line, character: values[values.length - 1].range.end.character },
	);
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Expected end of input.`
	};
}

function createMissingSequenceValueDiagnostic(field: ASTField, values: ASTValue[], schema: TypeDefinition): Diagnostic | null {
	if (schema.type !== "sequence") {
		return null;
	}
	const missingValues = schema.elements.slice(values.length).map(typeToVerbose);
	return {
		severity: DiagnosticSeverity.Error,
		range: field.range,
		message: `Field requires more values:\n${missingValues.join(", ")}.`
	};
}

function validateConditionStringForActorStatValue(element: ASTElement, field: ASTField, compiledData: CompiledData, astIndex: Index): Diagnostic | null {
	const valuesToValidate = [...field.values[0].text.matchAll(/[^+]+/g)].map<ASTValue>(match => ({
		text: match[0],
		range: {
			start: { line: field.range.start.line, character: field.values[0].range.start.character + match.index },
			end: { line: field.range.start.line, character: field.values[0].range.start.character + match.index + match[0].length },
		}
	}));
	if (valuesToValidate.length === 0) {
		return null;
	}
	if (valuesToValidate.length === 1) {
		const statValidationResult = validateInput(element, field, [valuesToValidate[0]], { type: "kw", group: "ActorStatType" }, compiledData, astIndex);
		if (statValidationResult) {
			return statValidationResult;
		}
		return null;
	}
	if (valuesToValidate.length === 2) {
		const statValidationResult = validateInput(element, field, [valuesToValidate[0]], { type: "kw", group: "ActorStatSubType" }, compiledData, astIndex);
		if (statValidationResult) {
			return statValidationResult;
		}
		const substatDefinition = getSubstatDefinition("ActorStatSubType", valuesToValidate[0].text, 'Substat', compiledData);
		if (!substatDefinition) {
			console.error(`ActorStatSubType does not have substat for value ${valuesToValidate[0].text}`);
			return null;
		}
		const substatValidationResult = validateInput(element, field, [valuesToValidate[1]], substatDefinition, compiledData, astIndex);
		if (substatValidationResult) {
			return substatValidationResult;
		}
		return null;
	}
	if (valuesToValidate.length > 2) {
		return {
			severity: DiagnosticSeverity.Error,
			range: field.values[0].range,
			message: `Can't have multiple "+" symbols.`,
		};
	}
	return null;
}

function getSubstatDefinition(stat: string, statValue: string, substat: string, compiledData: CompiledData): TypeDefinition | null {
	const result = compiledData.keywords[stat]?.[statValue]?.influences?.[substat]?.input;
	return result ? result : null;
}

function typeToVerbose(t: TypeDefinition): string {
	switch (t.type) {
		case "any":
			return "Any";
		case "bool":
			return "Boolean";
		case "dependent":
			return `Dependent on ${t.field} field`;
		case "dependentRequired":
			return `Dependent on ${t.field} field (with required values)`;
		case "float":
			return "Float";
		case "id":
			return `${t.group} ID`;
		case "int":
			return "Integer";
		case "kw":
			return `${t.group} Keyword`;
		case "list":
			return `List of ${t.element}`;
		case "nothing":
			return "None";
		case "range":
			return "Range";
		case "sequence":
			return `Sequence ${(t.elements.map(typeToVerbose))}`;
		case "tagEmitter":
			return "Tag";
		case "tagReceiver":
			return `Tag of ${t.group}`;
		case "union":
			return t.elements.map(typeToVerbose).join(" or ");
		case "sub":
			return `Subtype(${t.group}, ${t.subtypeString}, ${typeToVerbose(t.subtypeValueType)})`;
	}
}