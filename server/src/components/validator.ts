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
					console.log(values)
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
					console.log(values)
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
					console.log(values)
					return createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
			}
	
		default:
			// console.log(`Unknown input type: ${definition.type}`)
			return null;
	}
}

const isIntegerString = (str: string) => /^-?\d+$/.test(str);

const isNumericString = (str: string) => !isNaN(Number(str));

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