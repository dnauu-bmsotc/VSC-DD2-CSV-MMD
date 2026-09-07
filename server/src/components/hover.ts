import { HoverParams, Hover, MarkupKind, Position, Range } from 'vscode-languageserver';
import { AST, ASTElement, ASTField, ASTValue, EvaluationType, GameType, gameTypeList,
	gameTypeToVerbose, getDependencyInfluencedType, ResourceScopeEligibleGameTypes,
	resourceScopeToVerbose, TypeEvaluated, typeEvaluatedToVerbose
} from './parser';
import { Element, Field, TypeDefinition, typeHasDependent, TypeID, typeToVerbose } from './schema';
import { makeUriString, UriString } from '../../../shared/utils';
import { ProjectManager } from './project';
import { ERType, getKeyFromElement, KeyInfo, Receiver } from '.';
import * as path from 'node:path';

export class HoverManager {
	constructor(
		private readonly project: ProjectManager,
	) {}

	onHover(hoverParams: HoverParams): Hover | null {
		if (!this.project.getConfiguration().features.hintsOnHover) {
			return null;
		}
		try {
			const uri = makeUriString(hoverParams.textDocument.uri);
			const position = hoverParams.position;
			const ast = this.project.getFileState(uri)?.ast;
			if (!ast) {
				return null;
			}
			const context = this.findWhatIsAtPosition(uri, ast, position);
			if (context.element) {
				const elementDefinition = this.project.compiledData.schema[context.element.elementType];
				if (!elementDefinition) {
					return null;
				}
				if (context.field) {
					const fieldDefinition = elementDefinition.fields[context.field.name];
					if (!fieldDefinition) {
						return null;
					}
					if (context.value) {
						const valueDefinition = fieldDefinition.input;
						if (!valueDefinition) {
							return null;
						}
						else {
							return this.hoverOverValue(context, elementDefinition, fieldDefinition, valueDefinition);
						}
					}
					else {
						return this.hoverOverField(context, elementDefinition, fieldDefinition);
					}
				}
				else {
					return this.hoverOverElement(context, elementDefinition);
				}
			}
			else {
				return null;
			}
		}
		catch (e) {
			console.error(e);
			return null;
		}
	}

	private findWhatIsAtPosition(uri: UriString, ast: AST, position: Position): HoverContext {
		for (const element of ast) {
			if ((element.range.start.line === position.line)) {
				return { uri, position, element };
			}
			if ((element.fields.length > 0)
				&& (element.fields[0].range.start.line <= position.line)
				&& (position.line <= element.fields[element.fields.length - 1].range.start.line)) {
				for (const field of element.fields) {
					if (field.range.start.line === position.line) {
						if (position.character <= field.range.end.character) {
							return { uri, position, element, field };
						}
						const value = this.findWhatValueIsAtPosition(field.values, position);
						if (value) {
							return { uri, position, element, field, value };
						}
					}
				}
			}
		}
		return { uri, position };
	}

	private findWhatValueIsAtPosition(values: ASTValue[], position: Position): ASTValue | null {
		for(const value of values) {
			if ((value.range.start.character <= position.character) && (position.character <= value.range.end.character)) {
				if (value.evaluatedType?.evaluationType === EvaluationType.psv) {
					return this.findWhatValueIsAtPosition(value.evaluatedType.values, position);
				}
				else {
					return value;
				}
			}
		}
		return null;
	}

	private hoverOverValue(c: HoverContextValue, elementDefinition: Element, fieldDefinition: Field, fieldInputDefinition: TypeDefinition): Hover | null {
		let message = `(Value) "${c.value.text}"`
		if (c.value.evaluatedType) {
			message += `\n\nEvaluated type: \`${typeEvaluatedToVerbose(c.value.evaluatedType)}\``;
		}
		message += this.hoverValueAddiionForDependentFields(c, elementDefinition, fieldInputDefinition);
		message += this.hoverValueAddiionForReferences(c);
		message += this.hoverValueAddiionForDefinitions(c);
		return this.createHover(message, c.value.range);
	}

	private hoverOverField(c: HoverContextField, elementDefinition: Element, fieldDefinition: Field): Hover | null {
		let message = `(Field) ${c.field.name}`;
		message += `\n\nExpected input: \`${typeToVerbose(fieldDefinition.input)}\``;
		if (fieldDefinition.comment) {
			message += `\n\nComment: ${fieldDefinition.comment}`;
		}
		message += this.hoverFieldAdditionForDependentFields(c, fieldDefinition);
		return this.createHover(message, c.field.range);
	}

	private hoverOverElement(c: HoverContextElement, elementDefinition: Element): Hover | null {
		let message = `(Element) ${c.element.name}`;
		message += `\n\nType: \`${elementDefinition.name}\` (${elementDefinition.addable ? "Addable" : "Not Addable"})`;
		if (elementDefinition.comment) {
			message += `\n\nComment: ${elementDefinition.comment}`;
		}
		message += this.hoverElementAdditionForSameSignatures(c);
		message += this.hoverElementAdditionReferences(c);
		return this.createHover(message, c.element.range);
	}

	private getJumpUri(uri: UriString, range: Range) {
		const fragment = `L${range.start.line + 1}:${range.start.character + 1}-L${range.end.line + 1}:${range.end.character + 1}`;
		return `${uri}${fragment ? '#' + fragment : ''}`;
	}

	private createHover(message: string, range: Range): Hover {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: message,
			},
			range: range,
		}
	}

	private hoverFieldAdditionForDependentFields(c: HoverContextField, definition: Field): string {
		if ((definition.input.type !== TypeID.dependent) && (definition.input.type !== TypeID.dependentRequired)) {
			return "";
		}
		let addition = "";
		const influencedTypes = getDependencyInfluencedType(c.element, c.field, definition.input, this.project.compiledData.schema, this.project.compiledData.keywords);
		if (!influencedTypes || (influencedTypes.types.length === 0)) {
			return addition;
		}
		const fieldInfluencer = influencedTypes.influenceSourceField;
		if (influencedTypes.isDependentOnList) {
			addition += `\n\nExpected for each value of *${fieldInfluencer.name}* field:`
			if (this.listHasEqualObjects(influencedTypes.types)) {
				const type = influencedTypes.types[0];
				if (type) {
					addition += `\`${typeToVerbose(type)}\``;
				}
			}
			else {
				const influenceDict = Object.fromEntries(
					fieldInfluencer.values.map((k, i) => [k.text, influencedTypes.types[i]])
				);
				for (const k of Object.keys(influenceDict)) {
					if (influenceDict[k]) {
						addition += `\n- \`${k}\` -> \`${typeToVerbose(influenceDict[k])}\``;
					}
				}
			}
		}
		else {
			const type = influencedTypes.types[0];
			if (type) {
				addition += `\n\nExpected input: \`${typeToVerbose(type)}\``;
			}
		}
		return addition;
	}

	private listHasEqualObjects(l: any[]) {
		return (l.length === 0) || l.every(x => this.objectsAreEqual(x, l[0]));
	}

	private objectsAreEqual(a: any, b: any) {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	private hoverValueAddiionForDependentFields(c: HoverContextValue, elementDefinition: Element, fieldInputDefinition: TypeDefinition): string {
		let addition = "";
		const groupIfThisFieldIsDependent = typeHasDependent(fieldInputDefinition);
		const fieldInfluencer = groupIfThisFieldIsDependent ?? c.field.name;
		if (elementDefinition.fields[fieldInfluencer]?.input.type !== TypeID.list) {
			return "";
		}
		const connectedFields = c.element.fields
			.filter(field => {
				const group = typeHasDependent(elementDefinition.fields[field.name].input);
				if ((fieldInfluencer === group) || (fieldInfluencer === field.name)) {
					return true;
				}
			});
		if (connectedFields.length < 2) {
			return "";
		}
		const tableObj = Object.fromEntries(c.element.fields
			.filter(field => connectedFields.find(f => f.name === field.name))
			.map(field => [field.name, field.values.map(v => v.text)])
		);
		if (Object.keys(tableObj).length < 2) {
			return "";
		}
		const idx = this.findHoveredValuePosition(c);
		addition += `\n\n`;
		addition += dictToMarkdownTable(tableObj, idx);
		return addition;
	}

	private hoverValueAddiionForReferences(c: HoverContextValue): string {
		let result = "";
		const keys = this.findReferenceKeys(c, c.value.evaluatedType);
		if (keys.length === 0) {
			return result;
		}
		result += `\n\nDefinitions:`;
		for (const key of keys) {
			const emitters = this.project.index.findEmittersForAllGameTypes(key);
			for (const emitter of emitters) {
				const element = this.project.index.getElementByNumericId(emitter.ownerId);
				if (!element) {
					continue;
				}
				const fileName = path.basename(emitter.uri);
				result += `\n- (${resourceScopeToVerbose(element.scope)}) `;
				for (const gameType of gameTypeList) {
					if (element.overriddenBy[gameType]?.has(c.element.id)) {
						result += `[Overridden by the hovered element in ${gameTypeToVerbose(gameType)}] `;
					}
					if (c.element.overriddenBy[gameType]?.has(element.id)) {
						result += `[Overrides the hovered element in ${gameTypeToVerbose(gameType)}}] `;
					}
				}
				result += `[${fileName}](${this.getJumpUri(emitter.uri, emitter.range)}) `;
				result += `line: ${emitter.range.start.line + 1}`;
			}
		}
		return result;
	}
	
	private findReferenceKeys(c: HoverContextValue, value: TypeEvaluated): KeyInfo[] {
		const result: KeyInfo[] = [];
		switch (value?.evaluationType) {
			case EvaluationType.basic:
				const definition = value.definition;
				const isIdReference = definition.type === TypeID.id;
				const isTagReference = definition.type === TypeID.tagReceiver;
				if (isIdReference || isTagReference) {
					result.push({
						type: isIdReference ? ERType.id : ERType.tag,
						group: definition.group,
						name: c.value.text,
					});
				}
				return result;

			case EvaluationType.union:
				for (const valueOption of value.definitions) {
					result.push(...this.findReferenceKeys(c, valueOption));
				}
				return result;
		
			default:
				// psv is handled by the this.findWhatValueIsAtPosition function
				return result;
		}
	}

	private hoverElementAdditionForSameSignatures(c: HoverContextElement): string {
		let result = `\n\nElements with the same ID and type:`
		for (const emitter of this.project.index.findEmittersForAllGameTypes(getKeyFromElement(c.element))) {
			const doppelganger = this.project.index.getElementByNumericId(emitter.ownerId);
			if (!doppelganger) {
				continue;
			}
			const fileName = path.basename(emitter.uri);
			result += `\n- (${resourceScopeToVerbose(doppelganger.scope)}) `;
			if (doppelganger.id === c.element.id) {
				result += `[Hovered element] `
			}
			for (const gameType of gameTypeList) {
				if (doppelganger.overriddenBy[gameType]?.has(c.element.id)) {
					result += `[Overridden by the hovered element in ${gameTypeToVerbose(gameType)}] `;
				}
				if (c.element.overriddenBy[gameType]?.has(doppelganger.id)) {
					result += `[Overrides the hovered element in ${gameTypeToVerbose(gameType)}}] `;
				}
			}
			result += `[${fileName}](${this.getJumpUri(emitter.uri, emitter.range)}) `;
			result += `line: ${emitter.range.start.line + 1}`;
		}
		return result;
	}

	private hoverElementAdditionReferences(c: HoverContextElement): string {
		const allReceivers = this.project.index.findReceiversForAllGameTypes({ type: ERType.id, group: c.element.elementType, name: c.element.name });
		return this.hoverAdditionReferences(c, allReceivers);
	}

	private hoverValueAddiionForDefinitions(c: HoverContextValue): string {
		if (c.value.evaluatedType?.evaluationType !== EvaluationType.basic) {
			return "";
		}
		const definition = c.value.evaluatedType.definition;
		if (definition.type === TypeID.tagEmitter) {
			const allReceivers = this.project.index.findReceiversForAllGameTypes({ type: ERType.tag, group: definition.group, name: c.value.text });
			return this.hoverAdditionReferences(c, allReceivers);
		}
		else {
			return "";
		}
	}

	private hoverAdditionReferences(c: HoverContextElement | HoverContextValue, receivers: Receiver[]): string {
		let result = receivers.length ? `\n\nReferences:` : `\n\nNo references found in CSV files.`;
		for (const receiver of receivers) {
			const receiverOwner = this.project.index.getElementByNumericId(receiver.ownerId);
			if (!receiverOwner) {
				continue;
			}
			// check if this reference relies on the given definition or if this definition is overridden
			const definitionIsReferredToInGameTypes: Set<GameType> = new Set();
			for (const gameType of ResourceScopeEligibleGameTypes[receiverOwner.scope]) {
				for (const emitter of this.project.index.findEmitters(gameType, receiver)) {
					if (emitter.ownerId === c.element.id) {
						definitionIsReferredToInGameTypes.add(gameType);
						break;
					}
				}
			}
			const fileName = path.basename(receiver.uri);
			result += `\n- [${[...definitionIsReferredToInGameTypes].map(gameTypeToVerbose).join(', ')}] `;
			result += `${receiverOwner.elementType} ${receiverOwner.name} `;
			result += `([${fileName}](${this.getJumpUri(receiver.uri, receiver.range)}) line: ${receiver.range.start.line + 1})`;
		}
		return result;
	}

	/**
	 * Searches the position of the hovered value.
	 * 
	 * Example: key_map,health_damage,health_damage_range,crit_chance,
	 * 
	 * If cursor is hovered over health_damage_range, this function will return 1.
	 */
	private findHoveredValuePosition(c: HoverContextValue): number {
		for (let i = 0; i < c.field.values.length; i++) {
			const v = c.field.values[i];
			if ((v.range.start.character <= c.position.character) && (c.position.character <= v.range.end.character)) {
				return i;
			}
		}
		return 0;
	}
}

type HoverContext =
	| HoverContextValue
	| HoverContextField
	| HoverContextElement
	| HoverContextNone

interface HoverContextValue   { uri: UriString, position: Position; element: ASTElement; field: ASTField; value: ASTValue; }
interface HoverContextField   { uri: UriString, position: Position; element: ASTElement; field: ASTField; value?: never; }
interface HoverContextElement { uri: UriString, position: Position; element: ASTElement; field?: never;   value?: never; }
interface HoverContextNone    { uri: UriString, position: Position; element?: never;     field?: never;   value?: never; }

function dictToMarkdownTable(data: Record<string, string[]>, highlightRow: number): string {
	const m_chancesReplaced = replaceChancesWithWeightedValues(data);
	const headers = Object.keys(data);
	if (headers.length === 0) {
		return "";
	}
	const maxRows = Math.max(...Object.values(data).map(arr => arr.length));
	let result = `| № | ${headers.join(" | ")} |`;
	result += `\n| --- | ${headers.map(() => "---").join(" | ")} |`;
	for (let i = 0; i < maxRows; i++) {
		const row = headers.map(header => {
			const cellValue = data[header][i];
			if (!cellValue) {
				return "";
			}
			return (i === highlightRow ? `**${cellValue}**` : cellValue);
		});
		result += `\n| **${i + 1}** | ${row.join(" | ")} |`;
	}
	if (m_chancesReplaced) {
		result += `\n\nChances are calculated with no condition input.`
	}
	return result;
}

function replaceChancesWithWeightedValues(tableObj: Record<string, string[]>): boolean {
	const m_chances = tableObj["m_chances"]?.map(cell => parseFloat(cell));
	if (m_chances?.every(n => typeof n === 'number')) {
		const total = m_chances.reduce((sum, val) => sum + val, 0);
		const formatNumber = (num: number) => parseFloat(num.toFixed(2));
		const weightedValues = m_chances.map(val => `${formatNumber(val)} (${formatNumber(val / total * 100).toFixed(2)}%)`);
		tableObj["m_chances"] = weightedValues;
		return true;
	}
	return false;
}