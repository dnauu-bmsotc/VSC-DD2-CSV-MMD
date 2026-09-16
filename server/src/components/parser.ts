import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';
import * as path from 'node:path';
import { FieldsDescription, TypeDefinition, TypeDefinitionBasic, TypeDefinitionDependent,
	TypeDefinitionDependentRequired, TypeID, typeToVerbose, ValuesDescription } from './schema';
import { UriString } from '../../../shared/utils';

export type AST = ASTElement[];

export type ElementNumberID = number;

export interface ASTElement {
	id: ElementNumberID;
	name: string;
	elementType: string;
	fields: ASTField[];
	range: Range;
	fullRange: Range;
	diagnostics: MmdDiagnostic[];
	scope: ResourceScope;
	overriddenBy: Partial<Record<GameType, Set<ElementNumberID>>>;
}

export interface ASTField {
	name: string;
	values: ASTValue[];
	range: Range;
}

export interface ASTValue {
	text: string;
	range: Range;
	evaluatedType: TypeEvaluated;
}

export enum EvaluationType { basic, psv, union };
export type TypeEvaluated =
	| null
	| { evaluationType: EvaluationType.basic;	definition: TypeDefinitionBasic }
	| { evaluationType: EvaluationType.union;	definitions: TypeEvaluated[] }
	| { evaluationType: EvaluationType.psv;		values: ASTValue[] };

export interface ASTParseResult {
	AST: AST;
	diagnostics: MmdDiagnostic[];
}

export interface MmdDiagnostic {
	diagnostic: Diagnostic;
	flags: DiagnosticType;
}

export const enum DiagnosticType {
	Comment			= 1 << 0,
	ElementBoundary	= 1 << 1,
	ElementType		= 1 << 2,
	FieldName		= 1 << 3,
	FieldValue		= 1 << 4,
	NotAddable		= 1 << 5,
	Whitespace		= 1 << 6,
}

export enum GameType {
	Expedition, Kingdom,
}

export const gameTypeList = Object.values(GameType).filter(v => typeof v === "number");

export enum ResourceScope {
	General, Expedition, Kingdom,
	GeneralOverride, ExpeditionOverride, KingdomOverride,
}

export const ResourceScopePriority: Record<ResourceScope, number> = {
	[ResourceScope.General]: 0,
	[ResourceScope.Expedition]: 1,
	[ResourceScope.Kingdom]: 1,
	[ResourceScope.GeneralOverride]: 2,
	[ResourceScope.ExpeditionOverride]: 2,
	[ResourceScope.KingdomOverride]: 2,
}

export const ResourceScopeEligibleGameTypes: Record<ResourceScope, GameType[]> = {
	[ResourceScope.General]: [GameType.Expedition, GameType.Kingdom],
	[ResourceScope.GeneralOverride]: [GameType.Expedition, GameType.Kingdom],
	[ResourceScope.Expedition]: [GameType.Expedition],
	[ResourceScope.ExpeditionOverride]: [GameType.Expedition],
	[ResourceScope.Kingdom]: [GameType.Kingdom],
	[ResourceScope.KingdomOverride]: [GameType.Kingdom],
}

export class Parser {
	private nextId = 0;

	public parseIntoAST(uri: UriString, text: string): ASTParseResult {
		const scope = getFileScope(uri);
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

			if (line.startsWith('//') || line.startsWith('#')) {
				const message = "Comments in CSV files are not supported by the game engine. " +
					"\n\n\"//\" or any other sequences are not filtered out which might cause unexpected behavior. " +
					"\n\nThis warning can be turned off in the extension settings.";
				pushDiagnostic(message, lineStartPos, lineEndPos, DiagnosticType.Comment, DiagnosticSeverity.Warning);
			}
			else if (line.startsWith('element_start')) {
				if (current) {
					pushDiagnostic("Expected element_end", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
				}
				const parts = line.split(',');
				if (parts.length >= 3) {
					current = {
						name: parts[1],
						elementType: parts[2],
						fields: [],
						range: { start: lineStartPos, end: lineEndPos },
						id: this.nextId,
						diagnostics: [],
						scope: scope,
						overriddenBy: {},
					};
					this.nextId += 1;
				}
				else {
					pushDiagnostic("Incomplete element definition.", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
				}
			}
			else if (line.startsWith('element_end')) {
				if (current) {
					elements.push({
						...current,
						fullRange: {
							start: { ...current.range.start },
							end: { line: i, character: line.length },
						},
					});
					current = null;
					if (line.replaceAll(',', '') !== 'element_end') {
						pushDiagnostic("Expected element_end", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
					}
				}
				else {
					pushDiagnostic("Missing element_start", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
				}
			}
			else {
				if (current) {
					const parts = [];
					let start = 0;
					const lineTrunc = this.truncateTrailingCommas(line);
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
							evaluatedType: null,
						});
					}
				}
				else if (this.stringHasOnlyCommasAndSpaces(line)) {
					// nothing
				}
				else {
					if (line.trim()) {
						pushDiagnostic("Missing element_start", lineStartPos, lineEndPos, DiagnosticType.ElementBoundary);
					}
				}
			}
			
			if (current) { // whitespaces outside elements are not checked.
				diagnostics.push(...this.markWhitespaces(line, i));
			}
		}
		return {
			AST: elements,
			diagnostics: diagnostics,
		};
	}

	private markWhitespaces(line: string, lineNumber: number): MmdDiagnostic[] {
		const regex = /\s+/g; 
		const matches = [...line.matchAll(regex)];
		const result: MmdDiagnostic[] = [];
		for (const match of matches) {
			const startChar = match.index;
			const endChar = startChar + match[0].length;
			result.push({
				diagnostic: {
					severity: DiagnosticSeverity.Information,
					range: {
						start: { line: lineNumber, character: startChar },
						end: { line: lineNumber, character: endChar },
					},
					message: `Spaces count as individual characters. This message can be disabled in the extension settings.`,
				},
				flags: DiagnosticType.Whitespace,
			});
		}
		return result;
	}

	private stringHasOnlyCommasAndSpaces = (str: string) => /^[ ,]+$/.test(str);

	private truncateTrailingCommas(str: string) {
		let i = str.length;
		while (i > 0 && str[i - 1] === ',') {
			i--;
		}
		return i === str.length ? str : str.slice(0, i);
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
			evaluatedType: null,
		});
		idx += value.length + 1;
	}
	return result;
}

export function typeEvaluatedToVerbose(type: TypeEvaluated): string {
	if (!type) {
		return "Any";
	}
	switch (type.evaluationType) {
		case EvaluationType.basic:
			return typeToVerbose(type.definition);
			
		case EvaluationType.union:
			const options = type.definitions.map(definition => typeEvaluatedToVerbose(definition));
			return options.join(' or ');
		
		case EvaluationType.psv:
			const parts = type.values.map(v => typeEvaluatedToVerbose(v.evaluatedType));
			return parts.join('+');
	}
}

export function offsetElementByLines(element: ASTElement, offset: number) {
	element.range = offsetRangeByLines(element.range, offset);
	element.fullRange = offsetRangeByLines(element.fullRange, offset);
	for (const field of element.fields) {
		field.range = offsetRangeByLines(field.range, offset);
		for (const value of field.values) {
			value.range = offsetRangeByLines(value.range, offset);
		}
	}
	for (const diagnostic of element.diagnostics) {
		diagnostic.diagnostic.range = offsetRangeByLines(diagnostic.diagnostic.range, offset);
	}
}

/**
 * returns a new object to avoid situations where a range is shared
 * between two objects (like diagnostic's range references to value's range)
 * which causes double offset.
 */
function offsetRangeByLines(range: Range, offset: number): Range {
	return {
		start: { line: range.start.line + offset, character: range.start.character },
		end: { line: range.end.line + offset, character: range.end.character },
	}
}

export function getFileScope(fpath: string | UriString) {
	const parentDir = path.dirname(path.resolve(fpath));
	const parentDirName = path.basename(parentDir);
	const grandParentDirName = path.basename(path.dirname(parentDir));

	let scope = ResourceScope.General;

	switch (parentDirName) {
		case "expedition":
			scope = ResourceScope.Expedition;
			break;
		case "kingdom":
			scope = ResourceScope.Kingdom;
			break;
		default:
			scope = ResourceScope.General;
			break;
	}

	const overrider = (grandParentDirName === "Overrides") || (parentDirName === "Overrides");
	if (overrider) {
		switch (scope) {
			case ResourceScope.Expedition:
				scope = ResourceScope.ExpeditionOverride;
				break;
		case ResourceScope.Kingdom:
				scope = ResourceScope.KingdomOverride;
				break;
			case ResourceScope.General:
				scope = ResourceScope.GeneralOverride;
				break;
		}
	}

	return scope;
}

export function gameTypeToVerbose(gameType: GameType): string {
	switch (gameType) {
		case GameType.Expedition:
			return "Expeditions";
		case GameType.Kingdom:
			return "Kingdoms";
	}
}

export function resourceScopeToVerbose(scope: ResourceScope): string {
	switch (scope) {
		case ResourceScope.General:
			return "General";
		case ResourceScope.Expedition:
			return "Expeditions";
		case ResourceScope.Kingdom:
			return "Kingdoms";
		case ResourceScope.GeneralOverride:
			return "General (Overrides)";
		case ResourceScope.ExpeditionOverride:
			return "Expeditions (Overrides)";
		case ResourceScope.KingdomOverride:
			return "Kingdoms (Overrides)";
	}
}

export function elementIsEligibleForGameType(element: ASTElement, gameType: GameType): boolean {
	return !!element && ResourceScopeEligibleGameTypes[element.scope].includes(gameType);
}

export function elementsAreOnTheSameLevelAndGameType(e1: ASTElement, e2: ASTElement): boolean {
	const gt1 = ResourceScopeEligibleGameTypes[e1.scope];
	const gt2 = ResourceScopeEligibleGameTypes[e2.scope];
	return (gt1 === gt2) && (ResourceScopePriority[e1.scope] === ResourceScopePriority[e2.scope]);
}