import { TextDocumentPositionParams, CompletionItem, CompletionItemKind, MarkupKind, InsertTextFormat } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { listHasDuplicates, makeUriString } from '../../../shared/utils';
import { Field, TypeDefinition, TypeDefinitionID, TypeDefinitionKW, TypeDefinitionTagReceiver, TypeID, typeToVerbose } from './schema';
import { ASTElement, ASTField, getDependencyInfluencedType, ResourceScope, ResourceScopeEligibleGameTypes, resourceScopeToVerbose } from './parser';
import { ERType } from '.';
import * as path from 'node:path';

type CompletionData =
	| { type: "valueId", definition: TypeDefinitionID }
	| { type: "valueKw", definition: TypeDefinitionKW }
	| { type: "valueTag", definition: TypeDefinitionTagReceiver }

export class CompletionProvider {
	constructor(
		private readonly project: ProjectManager,
	) {}

	public getOnCompletion (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
		try {
			const t0 = performance.now();
			const result = this._getOnCompletion(textDocumentPosition);
			const duration = (performance.now() - t0).toFixed(1);
			// console.log(`Completion search [${duration} ms].`);
			return result;
		}
		catch (error) {
			console.error(error);
			return [];
		}
	};

	private _getOnCompletion(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
		if (!this.project.getConfiguration().features.autocomplete) {
			return [];
		}
		const uri = makeUriString(textDocumentPosition.textDocument.uri);
		const file = this.project.getFileState(uri); 
		const ast = file?.ast;
		const pos = textDocumentPosition.position;
		const schema = this.project.compiledData.schema;
		if (!ast) {
			return [];
		}
		const element = ast.find(e => (e.fullRange.start.line <= pos.line) && (pos.line <= e.fullRange.end.line));
		// element type completion
		if (!element) {
			const elementTypeItems = Object.keys(schema).map(elementType => ({
				kind: CompletionItemKind.Text,
				label: elementType,
				detail: schema[elementType]?.comment ?? "",
			}));
			const elementStructureSnippet: CompletionItem = {
				kind: CompletionItemKind.Snippet,
				insertTextFormat: InsertTextFormat.Snippet,
				label: 'Element block',
				detail: `element_start,id,type`,
				insertText: 'element_start,${1:id},${2:type}\n${3}\nelement_end',
			}
			return [
				...elementTypeItems,
				elementStructureSnippet,
				{ kind: CompletionItemKind.Text, label: 'element_start' },
				{ kind: CompletionItemKind.Text, label: 'element_end', },
			];
		}
		const elementDefinition = schema[element.elementType];
		if (!elementDefinition) {
			return [];
		}
		const strLine = file.text.split('\n')[pos.line].slice(0, pos.character);
		const nCommas = (strLine.match(/,/g) || []).length;
		// field name completion
		if (nCommas === 0) {
			return Object.keys(elementDefinition.fields).map(s => ({
				kind: CompletionItemKind.Text,
				label: s,
				detail: elementDefinition.fields[s]?.comment ?? "",
			}));
		}
		// field value completion
		if (nCommas > 0) {
			const field = element.fields.find(f => f.range.start.line === pos.line);
			if (!field) {
				return [];
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				return [];
			}
			return this.valueCompletion(element, field, fieldDefinition);
		}
		return [];
	}

	public onCompletionResolve(item: CompletionItem): CompletionItem {
		if (!item.data) {
			return item;
		}
		const data: CompletionData = item.data;
		switch (data.type) {
			case 'valueKw':
				break;

			case 'valueId':
				const idKey = { type: ERType.id, group: data.definition.group, name: item.label };
				const idEmitters = this.project.index.findEmittersForAllGameTypes(idKey);
				if (!idEmitters.length) {
					break;
				}
				item.documentation = {
					kind: MarkupKind.Markdown,
					value: '',
				};
				for (const idEmitter of idEmitters) {
					const element = this.project.index.getElementByNumericId(idEmitter.ownerId);
					if (!element) {
						continue;
					}
					const filename = path.basename(decodeURIComponent(idEmitter.uri));
					const scopeVerbose = resourceScopeToVerbose(element.scope);
					const link = `[${filename}](${this.project.getJumpUri(idEmitter.uri, element.range)})`;
					item.documentation.value += `\n\n(${scopeVerbose}) ${link} line ${element.fullRange.start.line + 1}`;
					const elementText = this.project.getElementText(element);
					if (elementText) {
						item.documentation.value += '\n\n' + elementText;
						const gameTypes = ResourceScopeEligibleGameTypes[element.scope];
						const supplementaryElements = this.project.index.findSupplementedBy(element, gameTypes);
						const elementsHaveDuplicateTypes = listHasDuplicates([...supplementaryElements].map(e => e.elementType));
						for (const supplementaryElement of supplementaryElements) {
							if (elementsHaveDuplicateTypes) {
								const uri = this.project.index.getUriFromElement(supplementaryElement);
								if (uri) {
									const fileName = path.basename(uri);
									const nLine = supplementaryElement.fullRange.start.line + 1;
									const link = `[${fileName}](${this.project.getJumpUri(uri, supplementaryElement.range)})`;
									item.documentation.value += `\n\n(${resourceScopeToVerbose(element.scope)}) ${link} line ${nLine}`;
								}
							}
							item.documentation.value += '\n\n' + this.project.getElementText(supplementaryElement);
						}
					}
				}
				break;

			case 'valueTag':
				break;
		}
		return item;
	}

	private valueCompletion(element: ASTElement, field: ASTField, fieldDefinition: Field): CompletionItem[] {
		const result: CompletionItem[] = [];
		const keywords = this.project.compiledData.keywords;
		const schema = this.project.compiledData.schema;

		let isBoolAdded = false;
		const idKeysAdded = new Set<string>();
		const kwAdded = new Set<string>();
		const tagsAdded = new Set<string>();
		const anyAdded = new Set<string>();
		const valueCompletionRecursive = (definition: TypeDefinition) => {
			switch (definition.type) {
				case TypeID.any:
					const anyValues = this.project.index.getAnyValues(element.elementType, field.name);
					if (!anyValues) {
						return;
					}
					const key = `${element.name},${field.name}`;
					if (!anyAdded.has(key)) {
						for (const v of [...anyValues]) {
							result.push({
								kind: CompletionItemKind.Text,
								label: v,
							});
						}
						anyAdded.add(key);
					}
					return;

				case TypeID.int:
				case TypeID.range:
				case TypeID.float:
				case TypeID.nothing:
					return;

				case TypeID.bool:
					if (!isBoolAdded) {
						result.push(
							{ kind: CompletionItemKind.Text, label: 'True' },
							{ kind: CompletionItemKind.Text, label: 'False', },
						);
						isBoolAdded = true;
					}
					return;

				case TypeID.id:
					const emitters = this.project.index.findAllEmittersByGroup(ERType.id, definition.group);
					for (const emitter of emitters) {
						const key = `${definition.group},${emitter.name}`;
						if (!idKeysAdded.has(key)) {
							const data: CompletionData = { type: "valueId", definition };
							result.push({
								kind: CompletionItemKind.Text,
								label: emitter.name,
								detail: typeToVerbose({ type: TypeID.id, group: definition.group }),
								data: data,
							});
							idKeysAdded.add(key);
						}
					}
					return;

				case TypeID.kw:
					const kwgroup = this.project.compiledData.keywords[definition.group];
					if (!kwgroup) {
						return;
					}
					const kws = Object.keys(kwgroup);
					for (const kw of kws) {
						if (!kwAdded.has(kw)) {
							const data: CompletionData = { type: "valueKw", definition };
							result.push({
								kind: CompletionItemKind.Text,
								label: kw,
								detail: kwgroup[kw].comment ?? "",
								data: data,
							});
							kwAdded.add(kw);
						}
					}
					return;

				case TypeID.tagEmitter:
					return;

				case TypeID.tagReceiver:
					const tagReceivers = this.project.index.findAllEmittersByGroup(ERType.tag, definition.group);
					for (const tagReceiver of tagReceivers) {
						const key = `${definition.group},${tagReceiver.name}`;
						if (!tagsAdded.has(key)) {
							const data: CompletionData = { type: "valueTag", definition };
							result.push({
								kind: CompletionItemKind.Text,
								label: tagReceiver.name,
								detail: typeToVerbose({ type: TypeID.tagReceiver, group: definition.group }),
								data: data,
							});
							tagsAdded.add(key);
						}
					}
					return;

				case TypeID.list:
					valueCompletionRecursive(definition.element);
					return;

				case TypeID.sequence:
				case TypeID.union:
					for (const x of definition.elements) {
						valueCompletionRecursive(x);
					}
					return;

				case TypeID.dependent:
				case TypeID.dependentRequired:
					const influencedTypes = getDependencyInfluencedType(element, field, definition, schema, keywords);
					if (!influencedTypes) {
						return;
					}
					for (let i = 0; i < influencedTypes.types.length; i++) {
						const influencedType = influencedTypes.types[i];
						if (influencedType) {
							valueCompletionRecursive(influencedType);
						}
					}
					return;

				case TypeID.sub:
					const KWGroup = keywords[definition.group];
					valueCompletionRecursive({ type: TypeID.kw, group: definition.group });
					const valueDesc = KWGroup[field.values[0].text];
					if (!valueDesc) {
						return;
					}
					const derivedType = valueDesc.influences?.[definition.subtypeString];
					if (!derivedType) {
						return;
					}
					valueCompletionRecursive(derivedType.input);
					if (!definition.subtypeValueType) {
						return;
					}
					valueCompletionRecursive(definition.subtypeValueType);
					return;

				case TypeID.psv:
					valueCompletionRecursive(definition.element);
					return;
			}
		}
		valueCompletionRecursive(fieldDefinition.input);
		return result;
	}
}