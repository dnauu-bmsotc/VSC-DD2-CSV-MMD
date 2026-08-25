import { FieldsDescription, TypeDefinition, TypeDefinitionDependent, TypeDefinitionDependentRequired } from './schema';
import { ASTElement, ASTField, ASTValue } from './parser';
import { ValuesDescription } from './compiler';
import { Range } from 'vscode-languageserver';

export interface Emitter {
	type: EmitterType;
	group: string;
	name: string;
	uri: string;
	range: Range;
}

export type EmitterType = "id" | "tag";

export type Receiver = Emitter;

export type KeyInfo = Pick<Emitter, "type" | "group" | "name">

function getKey(info: KeyInfo) {
	return `${info.type}:${info.group}:${info.name}`;
}

interface FileIndex {
	emitters: Emitter[];
	receivers: Receiver[];
}

interface IndexUpdateResult {
	affectedFiles: string[];
}

export class Index {
	private readonly emittersByKey = new Map<string, Emitter[]>();
	private readonly receiversByKey = new Map<string, Receiver[]>();
	private readonly fileIdexByUri = new Map<string, FileIndex>();

	constructor(
		private readonly schema: FieldsDescription,
		private readonly keywords: ValuesDescription,
	) {
	}

	public findEmitters(info: KeyInfo): Emitter[] {
		const key = getKey(info);
		return [...(this.emittersByKey.get(key) ?? []),];
	}

	public findEmittersByGroup(type: EmitterType, group: string): Emitter[] {
		const result: Emitter[] = [];
		for (const [key, emitters] of this.emittersByKey) {
			if (key.startsWith(`${type}:${group}:`)) {
				result.push(...emitters);
			}
		}
		return result;
	}

	public updateFileIndex(uri: string, elements: ASTElement[]): IndexUpdateResult {
		const oldFile = this.fileIdexByUri.get(uri);
		const oldEmitters = oldFile?.emitters ?? [];
		const newFile = this.analyseAST(uri, elements);
		const newEmitters = newFile.emitters;
		const affectedFiles = this.findAffectedFiles(uri, oldEmitters, newEmitters);
		if (oldFile) {
			this.removeFileWithEmitters(uri, oldFile);
		}
		this.fileIdexByUri.set(uri, newFile);
		for (const emitter of newFile.emitters) {
			const key = getKey(emitter);
			const emitters = this.emittersByKey.get(key) ?? [];
			emitters.push(emitter);
			this.emittersByKey.set(key, emitters);
		}
		for (const receiver of newFile.receivers) {
			const key = getKey(receiver);
			const receivers = this.receiversByKey.get(key) ?? [];
			receivers.push(receiver);
			this.receiversByKey.set(key, receivers);
		}
		return {
			affectedFiles: [...affectedFiles],
		};
	}

	public onFileRemove(uri: string): IndexUpdateResult {
		const fileIndex = this.fileIdexByUri.get(uri);
		if (!fileIndex) {
			return { affectedFiles: [] };
		}
		const affectedFiles = new Set<string>();
		for (const emitter of fileIndex.emitters) {
			const key = getKey(emitter);
			for (const receiver of this.receiversByKey.get(key) ?? []) {
				if (receiver.uri !== uri) {
					affectedFiles.add(receiver.uri);
				}
			}
		}
		this.removeFileWithEmitters(uri, fileIndex);
		return {
			affectedFiles: [...affectedFiles],
		}
	}

	private findAffectedFiles(uri: string, oldEmitters: Emitter[], newEmitters: Emitter[]): Set<string> {
		const oldKeys = new Set(oldEmitters.map(emitter => getKey(emitter)));
		const newKeys = new Set(newEmitters.map(emitter => getKey(emitter)));
		const keysChange = new Set<string>();
		for (const oldKey of oldKeys) {
			if (!newKeys.has(oldKey)) {
				keysChange.add(oldKey);
			}
		}
		for (const newKey of newKeys) {
			if (!oldKeys.has(newKey)) {
				keysChange.add(newKey);
			}
		}
		const affectedFiles = new Set<string>();
		for (const key of keysChange) {
			for (const receiver of this.receiversByKey.get(key) ?? []) {
				if (receiver.uri !== uri) {
					affectedFiles.add(receiver.uri);
				}
			}
		}
		return affectedFiles;
	}

	private removeFileWithEmitters(uri: string, index: FileIndex) {
		for (const emitterToRemove of index.emitters) {
			const key = getKey(emitterToRemove);
			const emitters = this.emittersByKey.get(key);
			if (!emitters) {
				continue;
			}
			const remainingEmitters = emitters.filter(e => e.uri !== uri);
			if (remainingEmitters.length === 0) {
				this.emittersByKey.delete(key);
			}
			else {
				this.emittersByKey.set(key, remainingEmitters);
			}
		}
		for (const receiverToRemove of index.receivers) {
			const key = getKey(receiverToRemove);
			const receivers = this.receiversByKey.get(key);
			if (!receivers) {
				continue;
			}
			const remainingReceivers = receivers.filter(e => e.uri !== uri);
			if (remainingReceivers.length === 0) {
				this.receiversByKey.delete(key);
			}
			else {
				this.receiversByKey.set(key, remainingReceivers);
			}
		}
	}

	private analyseAST(uri: string, elements: ASTElement[]): FileIndex {
		const emitters: Emitter[] = [];
		const receivers: Receiver[] = [];
		for (const element of elements) {
			if (element.elementType === "KingdomMap") {
				continue;
			}
			const elementDefinition = this.schema[element.elementType];
			if (!elementDefinition) {
				continue;
			}
			emitters.push({
				type: "id",
				group: element.elementType,
				name: element.name,
				uri: uri,
				range: element.range,
			});
			for (const field of element.fields) {
				const fieldDefinition = elementDefinition.fields[field.name];
				if (!fieldDefinition) {
					continue;
				}
				this.analyseField(element, field, field.values, fieldDefinition.input, uri, emitters, receivers);
			}
		}
		return {
			emitters,
			receivers,
		}
	}

	private analyseField(element: ASTElement, field: ASTField, values: ASTValue[], definition: TypeDefinition, uri: string, emitters: Emitter[], receivers: Receiver[]) {
		// if (!values.length) {
		// 	return;
		// }
		// switch (definition.type) {
		// 	case "any": case "bool": case "float":
		// 	case "int": case "range": case "kw":
		// 	case "nothing":
		// 		break;
		
		// 	case "id":
		// 		receivers.push({
		// 			type: "id",
		// 			group: definition.group,
		// 			name: values[0],
		// 			uri: uri,
		// 			range: 
		// 		});
		
		// 	default:
		// 		break;
		// }
	}
}

// function extractEmittedTags(index: Index, element: ASTElement, field: ASTField, values: ASTValue[], definition: TypeDefinition, schema: FieldsDescription, keywords: ValuesDescription) {
// 	switch (definition.type) {
// 		case "tagEmitter":
// 			if (!values.length) {
// 				break;
// 			}
// 			if (!index.tagGroups[definition.group]) {
// 				index.tagGroups[definition.group] = [];
// 			}
// 			if (!index.tagGroups[definition.group].includes(values[0].text)) {
// 				index.tagGroups[definition.group].push(values[0].text);
// 			}
// 			break;
// 		case "list":
// 			if (definition.element.type === "sequence") {
// 				const sequenceLength = definition.element.elements.length;
// 				for (let i = 0; i < values.length; i += sequenceLength) {
// 					if (i + sequenceLength > values.length) {
// 						// if incomplete sequence
// 						break;
// 					}
// 					extractEmittedTags(index, element, field, values.slice(i, i + sequenceLength), definition.element, schema, keywords);
// 				}
// 			}
// 			else {
// 				for (const value of values) {
// 					extractEmittedTags(index, element, field, [value], definition.element, schema, keywords);
// 				}
// 			}
// 			break;
// 		case "sequence":
// 			for (let i = 0; i < definition.elements.length; i++) {
// 				if (i >= values.length) {
// 					// if incomplete sequence
// 					break;
// 				}
// 				extractEmittedTags(index, element, field, [values[i]], definition.elements[i], schema, keywords);
// 			}
// 			break;
// 		case "union":
// 			// union is not processed because no tag emitters are unionized
// 			break;
// 		case "dependentRequired":
// 		case "dependent":
// 			const influencedTypes = getDependencyInfluencedTypeSilent(element, field, definition, schema, keywords);
// 			if (!influencedTypes) {
// 				break;
// 			}
// 			for (let i = 0; i < influencedTypes.types.length; i++) {
// 				const influencedType = influencedTypes.types[i];
// 				if (!influencedType) {
// 					continue;
// 				}
// 				const influencedValues = influencedTypes.isDependentOnList ? field.values.slice(i, i + 1) : field.values;
// 				extractEmittedTags(index, element, field, influencedValues, influencedType, schema, keywords);
// 			}
// 			break;
// 		default:
// 			break;
// 	}
// }


/**
 * Tries to get a list of types that dependent field can/needs to provide.
 * If the field-influencer has multiple values, this tries to get a list of types of the same length.
 */
export function getDependencyInfluencedTypeSilent(
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
	const influenceSourceSchemaContent = influenceSourceSchema.type === "list" ? influenceSourceSchema.element : influenceSourceSchema;
	if (influenceSourceSchemaContent.type !== "kw") {
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
		isDependentOnList: influenceSourceSchema.type === "list",
		influenceSourceField: influenceSourceField,
	};
}

