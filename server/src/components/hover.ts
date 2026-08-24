import { HoverParams, Hover, MarkupKind, Position, Range } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { Element, Field, TypeDefinition } from './schema';

export class HoverManager {
	constructor(
		private readonly project: ProjectManager,
	) {}

	onHover(hoverParams: HoverParams): Hover | null {
		const uri = hoverParams.textDocument.uri;
		const position = hoverParams.position;
		const file = this.project.get(uri);
		if (!file) {
			return null;
		}
		const context = this.findWhatIsAtPosition(file.ast, position);
		if (context.element) {
			const elementDefinition = this.project.compiledData.schema[context.element.elementType];
			if (context.field) {
				if (!elementDefinition) {
					return null;
				}
				const fieldDefinition = elementDefinition.fields[context.field.name];
				if (context.value) {
					if (!fieldDefinition) {
						return null;
					}
					const valueDefinition = fieldDefinition.input;
					if (!valueDefinition) {
						return null;
					}
					else {
						return this.hoverValue(context, valueDefinition);
					}
				}
				else {
					return this.hoverField(context, fieldDefinition);
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

	private findWhatIsAtPosition(ast: AST, position: Position): HoverContext {
		for (const element of ast) {
			if ((element.range.start.line === position.line)) {
				return { element: element };
			}
			if ((element.fields[0].range.start.line <= position.line) && (position.line <= element.fields[element.fields.length - 1].range.start.line)) {
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

	private hoverValue(c: HoverContextValue, definition: TypeDefinition): Hover | null {
		return this.createHover([
			`Value "${c.value.text}"`,
		], c.value.range);
	}

	private hoverField(c: HoverContextField, definition: Field): Hover | null {
		return this.createHover([
			`Field ${c.field.name}`,
			`Expected input: **${definition.inputString}**`,
			`Comment: ${definition.comment ? definition.comment : "none"}`,
		], c.field.range);
	}

	private hoverElement(c: HoverContextElement, definition: Element): Hover | null {
		const comment = this.project.compiledData.elementsDescription[c.element.name];
		return this.createHover([
			`Element **${c.element.name}** of type *${definition.name}*`,
			`Comment: ${comment ? comment : "none"}`,
		], c.element.range);
	}

	private createHover(messages: string[], range: Range): Hover {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: messages.join("\n\n"),
			},
			range: range,
		}
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