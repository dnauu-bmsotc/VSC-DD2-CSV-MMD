import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { DD2CSVMMDSettings } from './configuration';
import { AST, ASTField, ASTValue } from './parser';
import { CompiledData } from './compiler';
import { Index } from './indexer';
import { TypeDefinition } from './schema';

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
	for (const element of ast.elements) {
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
			}
			if (configuration.validateFieldInput) {
				const diagnostic = validateInput(field, field.values, fieldDefinition.input, compiledData, astIndex);
				diagnostic && diagnostics.push(diagnostic);
			}
		}
	}
	
	console.log(`Validation: ${(performance.now() - t0).toFixed(1)} ms`);
	return diagnostics;
}

function validateInput(field: ASTField, values: ASTValue[], definition: TypeDefinition, compiledData: CompiledData, astIndex: Index): Diagnostic | null {
	switch (definition.type) {
		case "any":
			return null;

		case "bool":
			if (values.length === 0) {
				return createExpectedTypeDiagnostic("boolean", field.range);
			}
			else {
				const content = values[0].text;
				if ((content !== "True") && (content !== "False")) {
					return createExpectedTypeDiagnostic("boolean", values[0].range);
				}
				if (values.length > 1) {
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}

		case "int":
			if (values.length === 0) {
				return createExpectedTypeDiagnostic("integer", field.range);
			}
			else {
				const content = values[0].text;
				if (!isIntegerString(content)) {
					return createExpectedTypeDiagnostic("integer", values[0].range);
				}
				if (values.length > 1) {
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}

		case "range":
			if (values.length === 0) {
				return createExpectedTypeDiagnostic("range", field.range);
			}
			else {
				const content = values[0].text;
				if (!isRangeString(content)) {
					return createExpectedTypeDiagnostic("range", values[0].range);
				}
				if (values.length > 1) {
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}
	
		case "float":
			if (values.length === 0) {
				return createExpectedTypeDiagnostic("float", field.range);
			}
			else {
				const content = values[0].text;
				if (!isNumericString(content)) {
					return createExpectedTypeDiagnostic("float", values[0].range);
				}
				if (values.length > 1) {
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}

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
					const diagnostic = validateInput(field, valuesSlice, definition.element, compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
				}
			}
			else {
				for (const v of values) {
					const diagnostic = validateInput(field, [v], definition.element, compiledData, astIndex);
					if (diagnostic) {
						return diagnostic;
					}
				}
			}
			return null;

		case "sequence":
			for (let i = 0; i < definition.elements.length; i++) {
				if (i >= values.length) {
					return createMissingSequenceValueDiagnostic(field, values, definition);
				}
				const diagnostic = validateInput(field, [values[i]], definition.elements[i], compiledData, astIndex);
				if (diagnostic) {
					return diagnostic;
				}
			}
			if (values.length > definition.elements.length) {
				return createExpectedEndOfInputDiagnostic(values.slice(definition.elements.length));
			}
			return null;

		case "union":
			const expectedTypeString = definition.elements.map(e => e.type).join(" or ");
			if (values.length === 0) {
				return createExpectedTypeDiagnostic(expectedTypeString, field.range);
			}
			else {
				let matchesAnyOption = false;
				for (const optionType of definition.elements) {
					const diagnostic = validateInput(field, values, optionType, compiledData, astIndex);
					if (!diagnostic) {
						matchesAnyOption = true;
						break;
					}
				}
				if (!matchesAnyOption) {
					return createExpectedTypeDiagnostic(expectedTypeString, field.range);
				}
				return null;
			}

		default:
			// console.log(`Unknown input type: ${definition.type}`)
			return null;
	}
}

const isIntegerStringRegex = /^-?\d+$/;
const isIntegerString = (str: string) => isIntegerStringRegex.test(str);

const isNumericString = (str: string) => !isNaN(Number(str));

const isRangeStringRegex = /^\[\d+-\d+\]$/;
const isRangeString = (str: string) =>isRangeStringRegex.test(str);

function createExpectedTypeDiagnostic(expectedType: string, range: Range): Diagnostic {
	return {
		severity: DiagnosticSeverity.Error,
		range: range,
		message: `Expected type: ${expectedType}`
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
	const missingValues = schema.elements.slice(values.length).map(x => x.type);
	return {
		severity: DiagnosticSeverity.Error,
		range: field.range,
		message: `Field misses more values: ${missingValues.join(", ")}.`
	};
}