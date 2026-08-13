import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';

interface AST {
	elements: ASTElement[];
}

interface ASTElement {
	name: string;
	elementType: string;
	fields: ASTField[];
	range: Range;
}

interface ASTField {
	name: string;
	values: ASTValue[];
	range: Range;
}

interface ASTValue {
	text: string;
	range: Range;
}

interface ASTParseResult {
	AST: AST;
	diagnostics: Diagnostic[];
}

export function parseIntoAST(text: string): ASTParseResult {
	const t0 = performance.now();
    const lines = text.split(/\r?\n/);
	const elements: ASTElement[] = [];
	let current: ASTElement | null = null;
	const diagnostics: Diagnostic[] = [];

	function pushDiagnostic(message: string, start: Position, end: Position) {
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
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
				pushDiagnostic("Expected element_end", lineStartPos, lineEndPos);
			}
			const parts = line.replace(/,+$/, "").split(',');
			if (parts.length >= 3) {
				current = {
					name: parts[1],
					elementType: parts[2],
					fields: [],
					range: Range.create(lineStartPos, lineEndPos),
				};
			}
			else {
				pushDiagnostic("Incomplete element definition", lineStartPos, lineEndPos);
			}
		}
		else if (line.startsWith('element_end')) {
			if (current) {
				elements.push(current);
				current = null;
			}
			else {
				pushDiagnostic("Missing element_start", lineStartPos, lineEndPos);
			}
		}
		else {
			if (current) {
				const parts = [...line.matchAll(/[^,]+/g)].map(match => ({
					value: match[0],
					start: { line: i, character: match.index },
					end: { line: i, character: match.index + match[0].length},
				}));
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
			else {
				if (line.trim()) {
					pushDiagnostic("Missing element_start", lineStartPos, lineEndPos);
				}
			}
		}
    }
	console.log(`AST parse: ${(performance.now() - t0).toFixed(1)} ms`);
	return {
		AST: { elements },
		diagnostics: diagnostics,
	};
}