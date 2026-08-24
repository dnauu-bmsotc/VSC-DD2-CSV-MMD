import { HoverParams, Hover, MarkupKind, Position, Range } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { AST, ASTElement, ASTField, ASTValue } from './parser';
import { Element, Field, TypeDefinition, typeToVerbose } from './schema';

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

	private hoverValue(c: HoverContextValue, definition: TypeDefinition): Hover | null {
		let message = `Value "${c.value.text}"`
		if (c.value.computedType) {
			message += `\n\nComputed type: **${typeToVerbose(c.value.computedType)}**`;
		}
		return this.createHover(message, c.value.range);
	}

	private hoverField(c: HoverContextField, definition: Field): Hover | null {
		let message = `Field ${c.field.name}`;
		message += `\n\nExpected input: **${definition.inputString}**`;
		if (definition.comment) {
			message += `\n\nComment: ${definition.comment}`;
		}
		return this.createHover(message, c.field.range);
	}

	private hoverElement(c: HoverContextElement, definition: Element): Hover | null {
		const comment = this.project.compiledData.elementsDescription[c.element.elementType].comment;
		let message = `Element **${c.element.name}** of type *${definition.name}*`;
		if (comment) {
			message += `\n\nComment: ${comment}`;
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