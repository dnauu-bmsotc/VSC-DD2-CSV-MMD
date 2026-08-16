import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { DD2CSVMMDSettings } from './configuration';
import { AST } from './parser';
import { CompiledData } from './compiler';
import { Index } from './indexer';

export function validateAstBySchema(
	ast: AST,
	compiledData: CompiledData,
	astIndex: Index,
	configuration: DD2CSVMMDSettings
): Diagnostic[] {
	if (!configuration.validateElementTypes) {
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
	}
	
	console.log(`Validation: ${(performance.now() - t0).toFixed(1)} ms`);
	return diagnostics;
}
