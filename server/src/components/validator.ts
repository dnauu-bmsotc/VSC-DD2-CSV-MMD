import { Diagnostic } from 'vscode-languageserver';
import { DD2CSVMMDSettings } from './configuration';
import { AST } from './parser';
import { FieldsDescription } from './schema';

export function validateAstBySchema(
	ast: AST,
	schema: FieldsDescription,
	configuration: DD2CSVMMDSettings
): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];
	for (const element of ast.elements) {

	}
	return diagnostics;
}