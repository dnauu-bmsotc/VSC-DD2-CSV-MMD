import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { CompiledData } from './compiler';
import { Index } from './indexer';
import { TypeDefinition, TypeDefinitionID } from './schema';
import { DD2CSVMMDSettings } from '../../../shared/settings';

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
		if (!compiledData.elementsDescription[element.elementType]) {
			if (configuration.validateElementTypes) {
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: element.elementTypeRange,
					message: `Unrecognized element type: ${element.elementType}`
				});
			}
			continue;
		}
		const elementDefinition = compiledData.schema[element.elementType];
		for (const field of element.fields) {
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				if (configuration.validateFieldNames) {
					diagnostics.push({
						severity: DiagnosticSeverity.Error,
						range: field.range,
						message: `Unrecognized field name: ${field.name}`
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
	
	console.log(`Validation: ${(performance.now() - t0).toFixed(1)} ms`);
	return diagnostics;
}

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
			if (values.length > 0) {
				return createExpectedEndOfInputDiagnostic(values);
			}
			return null;

		case "localization":
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
					return createExpectedTypeDiagnostic(definition, field.range);
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
				console.log(`Unrecognized KW group ${definition.group}`);
				return null;
			}
			return singleRefCheck(field, values, definition, Object.keys(keywords), undefined);

		// case "dependent":
		// 	const influenceSourceField = element.fields.filter(f => f.name === values[0].text)?.[0];
		// 	if (!influenceSourceField) {
		// 		return {
		// 			severity: DiagnosticSeverity.Error,
		// 			range: field.range,
		// 			message: `Missing required field ${values[0].text} in element ${element.name}.`,
		// 		};
		// 	}
		// 	const influenceSourceValue = influenceSourceField.values.length && influenceSourceField.values[0];
		// 	if (!influenceSourceValue) {
		// 		return {
		// 			severity: DiagnosticSeverity.Error,
		// 			range: field.range,
		// 			message: `Field-influencer ${influenceSourceField.name} in element ${element.name} is empty.`,
		// 		};
		// 	}
		// 	const influenceSourceSchema = compiledData.schema[element.name].fields[influenceSourceField.name].input;
		// 	if (influenceSourceSchema.type !== "kw") {
		// 		console.log(`Influence field ${field.name} is not a keyword field.`);
		// 		return null;
		// 	}
		// 	const influenceKWGroup = compiledData.keywords[influenceSourceSchema.group];
		// 	if (!influenceKWGroup) {
		// 		console.log(`Unrecognized dependency group ${definition.field}`);
		// 		return null;
		// 	}
		// 	const influenceValueDesc = influenceKWGroup[influenceSourceValue.text];
		// 	if (!influenceValueDesc) {
		// 		console.log(`Dependency of field ${field.name} by value ${influenceSourceValue.text} is not found.`);
		// 		return null;
		// 	}
		// 	const influenceType = influenceValueDesc.influences?.[field.name];
		// 	if (!influenceType) {
		// 		console.log(`Dependency of field ${field.name} by value ${influenceSourceValue.text} is not found.`);
		// 		return null;
		// 	}
		// 	validateInput(element, field, values, influenceType.input, compiledData, astIndex);

		default:
			// console.log(`Unknown input type: ${definition.type}`)
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
		return createExpectedTypeDiagnostic(type, field.range);
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
		return createExpectedTypeDiagnostic(referenceType, field.range);
	}
	else {
		const inMod = astIndexGroupEntries?.includes(values[0].text);
		if (!inMod) {
			const inVanilla = compiledDataGroupEntries?.includes(values[0].text);
			if (inVanilla) {
				if (values.length > 1) {
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}
		}
		else {
			if (values.length > 1) {
				return createExpectedEndOfInputDiagnostic(values.slice(1));
			}
			return null;
		}
		return createMissingGroupMemberDiagnostic(referenceType, values[0].range);
	}
}

function createMissingGroupMemberDiagnostic(expectedType: TypeDefinition, range: Range) {
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Unrecognized value. Expected value of type: ${typeToVerbose(expectedType)}`,
	};
}

function createExpectedTypeDiagnostic(expectedType: TypeDefinition, range: Range): Diagnostic {
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Expected type: ${typeToVerbose(expectedType)}`
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
		message: `Expected end of input`
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
		message: `Field misses more values: ${missingValues.join(", ")}.`
	};
}

function typeToVerbose(t: TypeDefinition): string {
	switch (t.type) {
		case "any":
			return "Any";
		case "bool":
			return "Boolean";
		case "dependent":
			return `Dependent on ${t.field} field`;
		case "float":
			return "Float";
		case "id":
			return `${t.group} ID`;
		case "int":
			return "Integer";
		case "kw":
			return "keyword";
		case "list":
			return "List";
		case "localization":
			return "Localization";
		case "nothing":
			return "None";
		case "range":
			return "Range";
		case "sequence":
			return "Sequence";
		case "tagEmitter":
			return "Tag";
		case "tagReceiver":
			return `Tag of ${t.group}`;
		case "union":
			return t.elements.map(typeToVerbose).join(" or ");
	}
}