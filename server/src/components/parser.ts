import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';
import { DD2CSVMMDSettings } from '../../../shared/settings';

export type AST = ASTElement[];

export interface ASTElement {
	name: string;
	elementType: string;
	fields: ASTField[];
	range: Range;
	elementTypeRange: Range;
}

export interface ASTField {
	name: string;
	values: ASTValue[];
	range: Range;
}

export interface ASTValue {
	text: string;
	range: Range;
}

export interface ASTParseResult {
	AST: AST;
	diagnostics: Diagnostic[];
}

export function parseIntoAST(text: string, configuration: DD2CSVMMDSettings): ASTParseResult {
	const lines = text.split(/\r?\n/);
	const elements: ASTElement[] = [];
	let current: ASTElement | null = null;
	const diagnostics: Diagnostic[] = [];

	function pushDiagnostic(message: string, start: Position, end: Position, severity?: DiagnosticSeverity) {
		diagnostics.push({
			severity: severity ? severity : DiagnosticSeverity.Error,
			range: { start: start, end: end},
			message: message,
		});
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineStartPos = { line: i, character: 0 };
		const lineEndPos = { line: i, character: line.length };

		if (line.startsWith('element_start')) {
			if (current) {
				if (configuration.validateElementBoundaries) {
					pushDiagnostic("Expected element_end", lineStartPos, lineEndPos);
				}
			}
			const parts = line.replace(/,+$/, "").split(',');
			if (parts.length >= 3) {
				current = {
					name: parts[1],
					elementType: parts[2],
					fields: [],
					range: Range.create(lineStartPos, lineEndPos),
					elementTypeRange: Range.create(
						{ line: i, character: line.indexOf(parts[2]) }, lineEndPos
					)
				};
			}
			else {
				if (configuration.validateElementBoundaries) {
					pushDiagnostic("Incomplete element definition", lineStartPos, lineEndPos);
				}
			}
		}
		else if (line.startsWith('element_end')) {
			if (current) {
				elements.push(current);
				current = null;
				if (line.replaceAll(',', '') !== 'element_end') {
					if (configuration.validateElementBoundaries) {
						pushDiagnostic("Expected element_end", lineStartPos, lineEndPos);
					}
				}
			}
			else {
				if (configuration.validateElementBoundaries) {
					pushDiagnostic("Missing element_start", lineStartPos, lineEndPos);
				}
			}
		}
		else {
			if (current) {
				const parts = [];
				let start = 0;
				const lineTrunc = line.replace(/,+$/, "");
				for (let j = 0; j <= lineTrunc.length; j++) {
					if (j === lineTrunc.length || lineTrunc[j] === ',') {
						const value = lineTrunc.substring(start, j);
						parts.push({
							value: value,
							start: { line: i, character: start },
							end: { line: i, character: j },
						});
						start = j + 1;
					}
				}
				if (parts.length >= 1) {
					current.fields.push({
						name: parts[0].value,
						values: [],
						range: Range.create(parts[0].start, parts[0].end),
					});
				}
				for (let i = 1; i < parts.length; i++) {
					current.fields[current.fields.length - 1].values.push({
						text: parts[i].value,
						range: Range.create(parts[i].start, parts[i].end),
					});
				}
			}
			else if (line.startsWith('//') || line.startsWith('#')) {
				if (!configuration.allowComments) {
					pushDiagnostic("Comments might cause errors", lineStartPos, lineEndPos, DiagnosticSeverity.Warning);
				}
			}
			else {
				if (line.trim()) {
					if (configuration.validateElementBoundaries) {
						pushDiagnostic("Missing element_start", lineStartPos, lineEndPos);
					}
				}
			}
		}
	}
	return {
		AST: elements,
		diagnostics: diagnostics,
	};
}