import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { CompiledData } from './compiler';
import { TypeDefinition, TypeDefinitionID, TypeDefinitionKW, TypeDefinitionSequence, TypeDefinitionTagReceiver } from './schema';
import { DD2CSVMMDSettings } from '../../../shared/settings';
import { FileState } from './project';
import { getDependencyInfluencedTypeSilent, Index, IndexGroups } from './indexer';

interface ValidationFileContext {
	ast: AST;
	compiledData: CompiledData;
	files: FileState[];
	configuration: DD2CSVMMDSettings;
}

interface ValidationValueContext {
	element: ASTElement;
	field: ASTField;
}

type ValidationContext = ValidationFileContext & ValidationValueContext;

export function validateAstBySchema(c: ValidationFileContext): Diagnostic[] {
	if (!c.configuration.validateElementTypes &&
		!c.configuration.validateFieldNames &&
		!c.configuration.validateFieldInput
	) {
		return [];
	}
	const diagnostics: Diagnostic[] = [];
	for (const element of c.ast) {
		if (element.elementType === "KingdomMap") {
			continue;
		}
		if (!c.compiledData.elementsDescription[element.elementType]) {
			if (c.configuration.validateElementTypes) {
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: element.elementTypeRange,
					message: `Unrecognized element type "${element.elementType}"`
				});
			}
			continue;
		}
		const elementDefinition = c.compiledData.schema[element.elementType];
		for (const field of element.fields) {
			if (!field.name) {
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				if (c.configuration.validateFieldNames) {
					diagnostics.push({
						severity: DiagnosticSeverity.Error,
						range: field.range,
						message: `Unrecognized field name "${field.name}"`
					});
				}
				continue;
			}
			if (c.configuration.validateFieldInput) {
				if (field.values.length === 0) {
					if (c.configuration.showEmptyFields) {
						diagnostics.push({
							severity: DiagnosticSeverity.Warning,
							range: field.range,
							message: `Empty field`
						});
					}
				}
				else {
					const context: ValidationContext = { ...c, element: element, field: field, };
					const diagnostic = validateInput(field.values, fieldDefinition.input, context);
					diagnostic && diagnostics.push(diagnostic);
				}
			}
		}
	}
	return diagnostics;
}

/**
 * Validates values against the provided type definition.
 * @values List of values to validate. These values might differ from c.field.values.
 * @returns One diagnostic object for the first error encountered.
 */
function validateInput(values: ASTValue[], definition: TypeDefinition, c: ValidationContext): Diagnostic | null {
	switch (definition.type) {
		case "any":
			return null;

		case "bool":
			return singleValueCheck(values, definition, isBoolString);

		case "int":
			return singleValueCheck(values, definition, isIntegerString);

		case "range":
			return singleValueCheck(values, definition, isRangeString);
	
		case "float":
			return singleValueCheck(values, definition, isNumericString);

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
						createMissingSequenceValueDiagnostic(values.slice(i), definition.element, c);
					}
					const valuesSlice = values.slice(i, i + listElementNumberOfValues);
					const diagnostic = validateInput(valuesSlice, definition.element, c);
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
					const diagnostic = validateInput([v], definition.element, c);
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
					return createMissingSequenceValueDiagnostic(values, definition, c);
				}
				if (definition.elements[i].type === "list") {
					listInSequence = true;
					const diagnostic = validateInput(values.slice(i), definition.elements[i], c);
					if (diagnostic) {
						return diagnostic;
					}
					break;
				}
				else {
					const diagnostic = validateInput([values[i]], definition.elements[i], c);
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
				return createExpectedTypeDiagnostic(definition, c.field.range);
			}
			else {
				let matchesAnyOption = false;
				for (const optionType of definition.elements) {
					const diagnostic = validateInput(values, optionType, c);
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
			return validateID(values, definition, c);

		case "tagEmitter":
			return null;

		case "tagReceiver":
			return validateTagReceived(values, definition, c);

		case "kw":
			const keywords = c.compiledData.keywords[definition.group];
			if (!keywords) {
				console.error(`Unrecognized KW group ${definition.group}`);
				return null;
			}
			return validateKeyword(values, definition, c);

		case "dependentRequired":
		case "dependent":
			const influencedFieldDefinition = definition;
			const influenceSourceField = c.element.fields.find(f => f.name === influencedFieldDefinition.field);
			if (!influenceSourceField) {
				return {
					severity: DiagnosticSeverity.Error,
					range: c.field.range,
					message: `Missing required field ${influencedFieldDefinition.field}.`,
				};
			}
			const influenceSourceSchema = c.compiledData.schema[c.element.elementType].fields[influenceSourceField.name].input;
			const influenceSourceSchemaContent = influenceSourceSchema.type === "list" ? influenceSourceSchema.element : influenceSourceSchema;
			if (influenceSourceSchemaContent.type !== "kw") {
				console.error(`Influence field ${c.field.name} in element ${c.element.name} is not a KW or List(KW) field.`);
				return null;
			}
			if ((c.field.values.length) && (influenceSourceField.values.length === 0)) {
				return {
					severity: DiagnosticSeverity.Error,
					range: c.field.range,
					message: `Field-influencer ${influenceSourceField.name} is empty.`,
				};
			}
			if ((influenceSourceSchema.type === "list")) {
				if ((definition.type === "dependentRequired") && (influenceSourceField.values.length != c.field.values.length)
					|| (definition.type === "dependent") && (influenceSourceField.values.length < c.field.values.length))
				return {
					severity: DiagnosticSeverity.Error,
					range: c.field.range,
					message: `Field-influencer ${influenceSourceField.name} has a different number of values (${influenceSourceField.values.length}) than this field (${c.field.values.length}).`,
				};
			}
			const influenceKWGroup = c.compiledData.keywords[influenceSourceSchemaContent.group];
			if (!influenceKWGroup) {
				console.error(`Unrecognized dependency group ${influenceSourceSchemaContent.group}`);
				return null;
			}
			if (influenceSourceField.values[0].text === "actor_stat_value") {
				return validateConditionStringForActorStatValue(c);
			}
			for (let i = 0; i < influenceSourceField.values.length; i++) {
				if (i >= c.field.values.length) {
					return null;
				}
				const sourceValue = influenceSourceField.values[i];
				const influenceValueDesc = influenceKWGroup[sourceValue.text];
				if (!influenceValueDesc) {
					console.error(`Dependency of field ${c.field.name} by value ${sourceValue.text} is not found.`);
					return null;
				}
				const influenceType = influenceValueDesc.influences?.[c.element.elementType + " " + c.field.name];
				if (!influenceType) {
					console.error(`Dependency of field ${c.field.name} by value ${sourceValue.text} is empty.`);
					return null;
				}
				const valuesToValidate = influenceSourceSchema.type === "list" ? c.field.values.slice(i, i + 1) : c.field.values;
				if ((definition.type === "dependentRequired") && (valuesToValidate.some(v => !v.text.trim()))) {
					return createExpectedTypeDiagnostic(influenceType.input, c.field.values[i].range);
				}
				const validationResult = validateInput(valuesToValidate, influenceType.input, c);
				if (validationResult) {
					return validationResult;
				}
			}
			return null;

		case 'sub':
			if (values.length !== 3) {
				return {
					severity: DiagnosticSeverity.Error,
					range: c.field.range,
					message: `Three values are required`,
				};
			}
			const groupValidateResult = validateInput([values[0]], { type: "kw", group: definition.group }, c);
			if (groupValidateResult) {
				return groupValidateResult;
			}
			const KWGroup = c.compiledData.keywords[definition.group];
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
			const subtypeValidateResult = validateInput([values[1]], derivedType.input, c);
			if (subtypeValidateResult) {
				return subtypeValidateResult;
			}
			return validateInput([values[2]], definition.subtypeValueType, c);

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

function singleValueCheck(values: ASTValue[], type: TypeDefinition, checker: (v: string) => boolean): Diagnostic | null {
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

function validateID(values: ASTValue[], definition: TypeDefinitionID, c: ValidationContext) {
	if (values.length === 0) {
		return null;
	}
	if (isCondition(definition)) {
		const validationResult = validateConditionID(values[0], definition, c);
		if (validationResult) {
			return validationResult;
		}
	}
	else {
		if (!isValueInGroupEntries(values[0].text, definition.group, c, getIdGroupsFromIndex)) {
			return createMissingGroupMemberDiagnostic(values[0], definition);
		}
	}
	if (values.length > 1) {
		return createExpectedEndOfInputDiagnostic(values.slice(1));
	}
	return null;
}

function validateTagReceived(values: ASTValue[], definition: TypeDefinitionTagReceiver, c: ValidationContext) {
	if (values.length === 0) {
		return null;
	}
	if (!isValueInGroupEntries(values[0].text, definition.group, c, getTagGroupsFromIndex)) {
		return createMissingGroupMemberDiagnostic(values[0], definition);
	}
	if (values.length > 1) {
		return createExpectedEndOfInputDiagnostic(values.slice(1));
	}
	return null;
}

function validateKeyword(values: ASTValue[], definition: TypeDefinitionKW, c: ValidationContext): Diagnostic | null {
	if (values.length === 0) {
		return null;
	}
	const kwgroup = c.compiledData.keywords[definition.group];
	if (!kwgroup) {
		console.error(`Keyword group ${definition.group} is not found.`);
		return null;
	}
	if (!Object.hasOwn(kwgroup, values[0].text)) {
		return createMissingGroupMemberDiagnostic(values[0], definition);
	}
	if (values.length > 1) {
		return createExpectedEndOfInputDiagnostic(values.slice(1));
	}
	return null;
}

type CallbackIsValueInGroupEntries = (index: Index) => IndexGroups;

const getIdGroupsFromIndex: CallbackIsValueInGroupEntries = (index: Index) => index.idGroups;
const getTagGroupsFromIndex: CallbackIsValueInGroupEntries = (index: Index) => index.tagGroups;

function isValueInGroupEntries(value: string, groupName: string, c: ValidationContext, getGroups: CallbackIsValueInGroupEntries): boolean {
	for (const fileState of c.files) {
		const groups = getGroups(fileState.index)[groupName];
		if (groups?.includes(value)) {
			return true;
		}
	}
	const groups = getGroups(c.compiledData.index)[groupName];
	if (!groups) {
		console.error(`Group ${groupName} is not found.`);
		return false;
	}
	if (groups.includes(value)) {
		return true;
	}
	return false;
}

function validateConditionID(value: ASTValue, definition: TypeDefinitionID, c: ValidationContext): Diagnostic | null {
	let idx = 0;
	for (const id of value.text.split("+")) {
		if (id === "") {
			continue;
		}
		if (!isValueInGroupEntries(id, definition.group, c, getIdGroupsFromIndex)) {
			const line = value.range.start.line;
			const charStart = value.range.start.character;
			const range: Range = {
				start: { line, character: charStart + idx },
				end: { line, character: charStart + idx + id.length },
			};
			return createMissingGroupMemberDiagnostic({ text: id, range }, definition);
		}
		idx += id.length + 1;
	}
	return null;
}

function isCondition(referenceType: TypeDefinition) {
	return ((referenceType.type === "id") && (referenceType.group === "Condition"))
}

function createMissingGroupMemberDiagnostic(value: ASTValue, expectedType: TypeDefinition) {
	return {
		severity: DiagnosticSeverity.Error,
		range: value.range,
		message: `Unrecognized value "${value.text}".\nExpected value of type:\n${typeToVerbose(expectedType)}`,
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

function createMissingSequenceValueDiagnostic(values: ASTValue[], definition: TypeDefinitionSequence, c: ValidationContext): Diagnostic | null {
	const missingValues = definition.elements.slice(values.length).map(etype => typeToVerbose(etype, ));
	return {
		severity: DiagnosticSeverity.Error,
		range: c.field.range,
		message: `Field requires more values:\n${missingValues.join(", ")}.`
	};
}

function validateConditionStringForActorStatValue(c: ValidationContext): Diagnostic | null {
	const valuesToValidate = [...c.field.values[0].text.matchAll(/[^+]+/g)].map<ASTValue>(match => ({
		text: match[0],
		range: {
			start: { line: c.field.range.start.line, character: c.field.values[0].range.start.character + match.index },
			end: { line: c.field.range.start.line, character: c.field.values[0].range.start.character + match.index + match[0].length },
		}
	}));
	if (valuesToValidate.length === 0) {
		return null;
	}
	if (valuesToValidate.length === 1) {
		const statValidationResult = validateInput([valuesToValidate[0]], { type: "kw", group: "ActorStatType" }, c);
		if (statValidationResult) {
			return statValidationResult;
		}
		return null;
	}
	if (valuesToValidate.length === 2) {
		const statValidationResult = validateInput([valuesToValidate[0]], { type: "kw", group: "ActorStatSubType" }, c);
		if (statValidationResult) {
			return statValidationResult;
		}
		const substatDefinition = getSubstatDefinition("ActorStatSubType", valuesToValidate[0].text, 'Substat', c.compiledData);
		if (!substatDefinition) {
			console.error(`ActorStatSubType does not have substat for value ${valuesToValidate[0].text}`);
			return null;
		}
		const substatValidationResult = validateInput([valuesToValidate[1]], substatDefinition, c);
		if (substatValidationResult) {
			return substatValidationResult;
		}
		return null;
	}
	if (valuesToValidate.length > 2) {
		return {
			severity: DiagnosticSeverity.Error,
			range: c.field.values[0].range,
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
		case "dependentRequired":
			return `Dependent on ${t.field} field`;
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
			return `Sequence ${(t.elements.map(etype => typeToVerbose(etype)))}`;
		case "tagEmitter":
			return "${t.group} tag definition";
		case "tagReceiver":
			return `${t.group} tag reference`;
		case "union":
			return t.elements.map(etype => typeToVerbose(etype)).join(" or ");
		case "sub":
			return `Subtype(${t.group}, ${t.subtypeString}, ${typeToVerbose(t.subtypeValueType)})`;
	}
}