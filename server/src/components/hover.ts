import { HoverParams, Hover, MarkupKind, Position, Range } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { Element, Field, TypeDefinition, typeHasDependent, typeToVerbose } from './schema';
import { getDependencyInfluencedTypeSilent } from './indexer';

export class HoverManager {
	constructor(
		private readonly project: ProjectManager,
	) {}

	onHover(hoverParams: HoverParams): Hover | null {
		try {
			const uri = hoverParams.textDocument.uri;
			const position = hoverParams.position;
			const file = this.project.get(uri);
			if (!file) {
				return null;
			}
			const context = this.findWhatIsAtPosition(file.ast, position);
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
							return this.hoverValue(context, elementDefinition, fieldDefinition, valueDefinition);
						}
					}
					else {
						return this.hoverField(context, elementDefinition, fieldDefinition);
					}
				}
				else {
					return this.hoverElement(context, elementDefinition);
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

	private findWhatIsAtPosition(ast: AST, position: Position): HoverContext {
		for (const element of ast) {
			if ((element.range.start.line === position.line)) {
				return { element: element };
			}
			if ((element.fields.length > 0)
				&& (element.fields[0].range.start.line <= position.line)
				&& (position.line <= element.fields[element.fields.length - 1].range.start.line)) {
				for (const field of element.fields) {
					if (field.range.start.line === position.line) {
						if (position.character <= field.range.end.character) {
							return { element: element, field: field };
						}
						for(const value of field.values) {
							if ((value.range.start.character <= position.character) && (position.character <= value.range.end.character)) {
								return { element: element, field: field, value: value };
							}
						}
					}
				}
			}
		}
		return { };
	}

	private hoverValue(c: HoverContextValue, elementDefinition: Element, fieldDefinition: Field, fieldInputDefinition: TypeDefinition): Hover | null {
		let message = `(Value) "${c.value.text}"`
		if (c.value.computedType) {
			message += `\n\nEvaluated type: **${typeToVerbose(c.value.computedType)}**`;
		}
		message += this.hoverValueAddiionForDependentFields(c, elementDefinition, fieldInputDefinition);
		return this.createHover(message, c.value.range);
	}

	private hoverField(c: HoverContextField, elementDefinition: Element, fieldDefinition: Field): Hover | null {
		let message = `(Field) ${c.field.name}`;
		message += `\n\nExpected input: **${typeToVerbose(fieldDefinition.input)}**`;
		if (fieldDefinition.comment) {
			message += `\n\nComment: ${fieldDefinition.comment}`;
		}
		message += this.hoverFieldAdditionForDependentFields(c, fieldDefinition);
		return this.createHover(message, c.field.range);
	}

	private hoverElement(c: HoverContextElement, definition: Element): Hover | null {
		const elementDescription = this.project.compiledData.elementsDescription[c.element.elementType];
		let message = `(Element) ${c.element.name}`;
		message += `\n\nType: *${definition.name}*`;
		if (elementDescription.comment) {
			message += `\n\nComment: ${elementDescription.comment}`;
		}
		return this.createHover(message, c.element.range);
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
		if ((definition.input.type !== "dependent") && (definition.input.type !== "dependentRequired")) {
			return "";
		}
		let addition = "";
		const cd = this.project.compiledData;
		const influencedTypes = getDependencyInfluencedTypeSilent(c.element, c.field, definition.input, cd.schema, cd.keywords);
		if (influencedTypes?.types) {
			const fieldInfluencer = influencedTypes.influenceSourceField;
			addition += `\n\nExpected for each value of *${fieldInfluencer.name}* field:`;
			const influenceDict = Object.fromEntries(fieldInfluencer.values.map((k, i) => [k.text, influencedTypes.types[i]]));
			for (const k of Object.keys(influenceDict)) {
				if (influenceDict[k]) {
					addition += `\n- *${k}* -> **${typeToVerbose(influenceDict[k])}**`;
				}
			}
		}
		return addition;
	}

	private hoverValueAddiionForDependentFields(c: HoverContextValue, elementDefinition: Element, fieldInputDefinition: TypeDefinition): string {
		let addition = "";
		const groupIfThisFieldIsDependent = typeHasDependent(fieldInputDefinition);
		const fieldInfluencer = groupIfThisFieldIsDependent ? groupIfThisFieldIsDependent : c.field.name;
		if (elementDefinition.fields[fieldInfluencer]?.input.type !== "list") {
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
		const idx = c.field.values.indexOf(c.value);
		addition += `\n\n`;
		addition += dictToMarkdownTable(tableObj, idx);
		return addition;
	}
}

type HoverContext =
	| HoverContextValue
	| HoverContextField
	| HoverContextElement
	| HoverContextNone

interface HoverContextValue   { element: ASTElement; field: ASTField; value: ASTValue; }
interface HoverContextField   { element: ASTElement; field: ASTField; value?: never; }
interface HoverContextElement { element: ASTElement; field?: never;   value?: never; }
interface HoverContextNone    { element?: never;     field?: never;   value?: never; }

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