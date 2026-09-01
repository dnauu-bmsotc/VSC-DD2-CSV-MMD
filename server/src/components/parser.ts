import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';
import { DD2CSVMMDSettings } from '../../../shared/settings';
import { FieldsDescription, TypeDefinition, TypeDefinitionDependent, TypeDefinitionDependentRequired, TypeID, ValuesDescription } from './schema';

export type AST = ASTElement[];

export type ElementNumberID = number;

export interface ASTElement {
	id: ElementNumberID;
	name: string;
	elementType: string;
	fields: ASTField[];
	range: Range;
	fullRange: Range;
	diagnostics?: MmdDiagnostic[];
}

export interface MmdDiagnostic {
	diagnostic: Diagnostic;
	flags: DiagnosticType;
}

export enum DiagnosticType {
	Comment			= 0,
	ElementBoundary	= 1 << 0,
	ElementType		= 1 << 1,
	FieldName		= 1 << 2,
	FieldValue		= 1 << 3,
	EmptyField		= 1 << 4,
}

export interface ASTField {
	name: string;
	values: ASTValue[];
	range: Range;
}

export interface ASTValue {
	text: string;
	range: Range;
	// evaluatedType?: TypeDefinition;
}

export interface ASTParseResult {
	AST: AST;
	diagnostics: MmdDiagnostic[];
}

export class Parser {
	private nextId = 0;

	public parseIntoAST(text: string, configuration: DD2CSVMMDSettings): ASTParseResult {
		const lines = text.split(/\r?\n/);
		const elements: ASTElement[] = [];
		let current: Omit<ASTElement, "fullRange"> | null = null;
		const diagnostics: MmdDiagnostic[] = [];

		function pushDiagnostic(message: string, start: Position, end: Position, flags: DiagnosticType, severity: DiagnosticSeverity=DiagnosticSeverity.Error) {
			diagnostics.push({
				diagnostic: {
					severity: severity,
					range: { start: start, end: end},
					message: message,
				},
				flags: flags,
			});
		}

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineStartPos = { line: i, character: 0 };
			const lineEndPos = { line: i, character: line.length };

			if (line.startsWith('element_start')) {
				if (current) {
					if (configuration.validateElementBoundaries) {
						pushDiagnostic("Expected element_end", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
					}
				}
				const parts = line.replace(/,+$/, "").split(',');
				if (parts.length >= 3) {
					current = {
						name: parts[1],
						elementType: parts[2],
						fields: [],
						range: { start: lineStartPos, end: lineEndPos },
						id: this.nextId,
					};
					this.nextId += 1;
				}
				else {
					if (configuration.validateElementBoundaries) {
						pushDiagnostic("Incomplete element definition.", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
					}
				}
			}
			else if (line.startsWith('element_end')) {
				if (current) {
					elements.push({
						...current,
						fullRange: {
							start: current.range.start,
							end: { line: i, character: line.length },
						},
					});
					current = null;
					if (line.replaceAll(',', '') !== 'element_end') {
						if (configuration.validateElementBoundaries) {
							pushDiagnostic("Expected element_end", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
						}
					}
				}
				else {
					if (configuration.validateElementBoundaries) {
						pushDiagnostic("Missing element_start", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
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
						pushDiagnostic("Comments might cause errors", lineStartPos, lineEndPos, DiagnosticType.Comment, DiagnosticSeverity.Warning);
					}
				}
				else {
					if (line.trim()) {
						if (configuration.validateElementBoundaries) {
							pushDiagnostic("Missing element_start", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
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
}


/**
 * Tries to get a list of types that dependent field can/needs to provide.
 * If the field-influencer has multiple values, this tries to get a list of types of the same length.
 */
export function getDependencyInfluencedType(
	element: ASTElement,
	field: ASTField,
	definition: TypeDefinitionDependent | TypeDefinitionDependentRequired,
	schema: FieldsDescription,
	keywords: ValuesDescription,
): {
	types: (TypeDefinition | null)[],
	isDependentOnList: boolean;
	influenceSourceField: ASTField,
} | null {
	const influenceSourceField = element.fields.find(f => f.name === definition.field);
	if (!influenceSourceField) {
		return null;
	}
	const influenceSourceSchema = schema[element.elementType].fields[influenceSourceField.name].input;
	const influenceSourceSchemaContent = influenceSourceSchema.type === TypeID.list ? influenceSourceSchema.element : influenceSourceSchema;
	if (influenceSourceSchemaContent.type !== TypeID.kw) {
		return null;
	}
	const influenceKWGroup = keywords[influenceSourceSchemaContent.group];
	const influencedTypes = influenceSourceField.values.map(v => {
		const influenceValueDesc = influenceKWGroup[v.text];
		if (influenceValueDesc?.influences) {
			const influenceType = influenceValueDesc.influences?.[element.elementType + " " + field.name];
			if (influenceType) {
				return influenceType.input;
			}
		}
		return null;
	});

	return {
		types: influencedTypes,
		isDependentOnList: influenceSourceSchema.type === TypeID.list,
		influenceSourceField: influenceSourceField,
	};
}

/**
 * Parses plus-separated value into AST values.
 */
export function parsePSV(x: ASTValue): ASTValue[] {
	const result: ASTValue[] = [];
	let idx = 0;
	const line = x.range.start.line;
	const charStart = x.range.start.character;
	for (const value of x.text.split("+")) {
		const range: Range = {
			start: { line, character: charStart + idx },
			end: { line, character: charStart + idx + value.length },
		};
		result.push({
			text: value,
			range: range,
		});
		idx += value.length + 1;
	}
	return result;
}