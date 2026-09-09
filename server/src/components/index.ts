import { ASTElement, ASTField, ASTValue, elementIsEligibleForGameType, ElementNumberID,
	GameType, gameTypeList, getDependencyInfluencedType, parsePSV, ResourceScopePriority } from './parser';
import { Range } from 'vscode-languageserver';
import { Brand, UriString } from '../../../shared/utils';
import { FieldsDescription, TypeDefinition, TypeID, ValuesDescription } from './schema';

export enum ERType { id, tag };

interface EmitterOrReceiverBase {
	type: ERType;
	group: string;
	name: string;
	uri: UriString;
	range: Range;
	ownerId: ElementNumberID;
}

export type Emitter = Brand<EmitterOrReceiverBase, "emitter">;

export type Receiver = Brand<EmitterOrReceiverBase, "receiver">;

export type EmitterOrReceiver = Emitter | Receiver;

export type KeyInfo = Pick<EmitterOrReceiver, "type" | "group" | "name">

export function makeEmitter(base: EmitterOrReceiverBase): Emitter {
	return base as Emitter;
}

export function makeReceiver(base: EmitterOrReceiverBase): Receiver {
	return base as Receiver;
}

function getKey(info: KeyInfo) {
	return `${info.type}:${info.group}:${info.name}`;
}

export function getKeyFromElement(element: ASTElement): KeyInfo {
	return { type: ERType.id, group: element.elementType, name: element.name };
}

export interface ElementIndexData {
	emitters: Emitter[],
	receivers: Receiver[],
}

export class Index {
	private readonly elements = new Map<ElementNumberID, ASTElement>();
	
	private readonly emittersByKey = new Map<string, Emitter[]>();
	private readonly receiversByKey = new Map<string, Receiver[]>();

	private readonly emittersByElement = new Map<ElementNumberID, Emitter[]>();
	private readonly receiversByElement = new Map<ElementNumberID, Receiver[]>();

	constructor(
		private readonly schema: FieldsDescription,
		private readonly keywords: ValuesDescription,
	) {}

	public removeElement(element: ASTElement) {
		this.elements.delete(element.id);
		const affectedElements = this.findElementsDependentOnEmittersOfAnElement(element.id, element.elementType, element.name);
		this.removeElementFromKeyList(element.id, this.emittersByKey, this.emittersByElement);
		this.removeElementFromKeyList(element.id, this.receiversByKey, this.receiversByElement);
		this.emittersByElement.delete(element.id);
		this.receiversByElement.delete(element.id);
		// find and update overrides
		const sameSignatureElements = this.findSameSignatureElements(element.elementType, element.name);
		this.updateOverridesInElements(getKeyFromElement(element), sameSignatureElements);
		for (const sameSignatureElement of sameSignatureElements) {
			affectedElements.add(sameSignatureElement);
		}
		return affectedElements;
	}

	public addElement(element: ASTElement, emitters: Emitter[], receivers: Receiver[]) {
		this.elements.set(element.id, element);

		const affectedElements = new Set<ElementNumberID>();
		this.emittersByElement.set(element.id, emitters);
		this.receiversByElement.set(element.id, receivers);
		this.addElementToKeyList(emitters, this.emittersByKey);
		this.addElementToKeyList(receivers, this.receiversByKey);
		// newly added emitters can resolve references
		for (const emitter of emitters) {
			const key = getKey(emitter);
			for (const receiver of this.receiversByKey.get(key) ?? []) {
				if (receiver.ownerId !== element.id) {
					affectedElements.add(receiver.ownerId);
				}
			}
		}
		// find and update overrides
		const sameSignatureElements = this.findSameSignatureElements(element.elementType, element.name);
		this.updateOverridesInElements(getKeyFromElement(element), [element.id, ...sameSignatureElements]);
		for (const sameSignatureElement of sameSignatureElements) {
			affectedElements.add(sameSignatureElement);
		}
		return affectedElements;
	}

	public findEmittersForAllGameTypes(info: KeyInfo): Emitter[] {
		return [...this.emittersByKey.get(getKey(info)) ?? []];
	}

	public findReceiversForAllGameTypes(info: KeyInfo): Receiver[] {
		return [...this.receiversByKey.get(getKey(info)) ?? []];
	}

	/**
	 * Searches for emitters for given game type and receiver info.
	 * 
	 * If an emitter is not available in the given game type, it is not included in the result.
	 * 
	 * If an emitter's owner element is overridden by another element in the given game type, it is also not included.
	 */
	public findEmitters(forGameType: GameType, info: KeyInfo): Emitter[] {
		const emitters = this.findEmittersForAllGameTypes(info);
		const filtered = emitters.filter(e => {
			const element = this.elements.get(e.ownerId);
			if (!element) {
				return false;
			}
			const overriders = element.overriddenBy[forGameType];
			if (overriders && overriders.size > 0) {
				return false;
			}
			if (!elementIsEligibleForGameType(element, forGameType)) {
				return false;
			}
			return true;
		});
		return filtered;
	}

	public getOverridersOfElement(id: ElementNumberID, info: KeyInfo, gameType: GameType): Set<ElementNumberID> {
		const overriders = new Set<ElementNumberID>();
		const element = this.elements.get(id);
		if (!element) {
			return overriders;
		}
		const emittersWithSameSignature = [...this.emittersByKey.get(getKey(info)) ?? []];
		for (const idEmitter of emittersWithSameSignature) {
			if (idEmitter.ownerId === id) {
				continue;
			}
			const candidate = this.elements.get(idEmitter.ownerId);
			if (!candidate) {
				continue;
			}
			if (!elementIsEligibleForGameType(candidate, gameType)) {
				continue;
			}
			if (ResourceScopePriority[element.scope] < ResourceScopePriority[candidate.scope]) {
				overriders.add(candidate.id);
			}
		}
		return overriders;
	}

	public getElementByNumericId(id: ElementNumberID) {
		return this.elements.get(id);
	}
	
	public getNumberOfElements() {
		return this.elements.size;
	}

	public getUriFromElement(element: ASTElement) {
		const idEmitters = this.emittersByKey.get(getKey(getKeyFromElement(element)));
		for (const emitter of idEmitters ?? []) {
			if (emitter.ownerId === element.id) {
				return emitter.uri;
			}
		}
	}

	public getReceiversByElementId(id: ElementNumberID) {
		return this.receiversByElement.get(id);
	}

	public getElements() {
		return this.elements.values();
	}

	private updateOverridesInElements(key: KeyInfo, ids: ElementNumberID[]) {
		for (const id of ids) {
			for (const gameType of gameTypeList) {
				const doppelganger = this.elements.get(id);
				if (!doppelganger) {
					continue;
				}
				doppelganger.overriddenBy[gameType] = this.getOverridersOfElement(id, key, gameType);
			}
		}
	}

	private findElementsDependentOnEmittersOfAnElement(id: ElementNumberID, elementType: string, elementName: string) {
		const affectedElements = new Set<ElementNumberID>();
		const oldEmitters = this.emittersByElement.get(id) ?? [];
		for (const emitter of oldEmitters) {
			const key = getKey(emitter);
			const receivers = this.receiversByKey.get(key) ?? [];
			for (const receiver of receivers) {
				if (receiver.ownerId !== id) {
					affectedElements.add(receiver.ownerId);
				}
			}
		}
		// find elements with the same name and type (for validation of addables)
		for (const sameSignatureElement of this.findSameSignatureElements(elementType, elementName)) {
			affectedElements.add(sameSignatureElement);
		}
		return affectedElements;
	}

	private findSameSignatureElements(type: string, name: string) {
		const idEmitters = this.emittersByKey.get(getKey({ type: ERType.id, group: type, name: name })) ?? [];
		return idEmitters.map(e => e.ownerId);
	}

	private removeElementFromKeyList<T extends EmitterOrReceiver>(
		id: ElementNumberID,
		byKey: Map<string, T[]> | Map<string, T[]>,
		byElement: Map<ElementNumberID, T[]> | Map<ElementNumberID, T[]>,
	) {
		const oldEoR = byElement.get(id) ?? [];
		for (const eor of oldEoR) {
			const key = getKey(eor);
			const candidatesForRemoval = byKey.get(key);
			if (!candidatesForRemoval) {
				continue;
			}
			const remaining = candidatesForRemoval.filter(r => r.ownerId !== id);
			if (remaining.length) {
				byKey.set(key, remaining);
			}
			else {
				byKey.delete(key);
			}
		}
	}

	private addElementToKeyList<T extends EmitterOrReceiver>(
		emittersOrReceivers: T[],
		byKey: Map<string, T[]> | Map<string, T[]>,
	) {
		for (const eor of emittersOrReceivers) {
			const key = getKey(eor);
			const eorWithTheSameKey = byKey.get(key) ?? [];
			eorWithTheSameKey.push(eor);
			byKey.set(key, eorWithTheSameKey);
		}
	}

	public indexElement(uri: UriString, element: ASTElement): ElementIndexData {
		const emitters: Emitter[] = [];
		const receivers: Receiver[] = [];
		const elementDefinition = this.schema[element.elementType];
		if (elementDefinition && elementDefinition.process) {
			// index element's id
			emitters.push(makeEmitter({
				type: ERType.id,
				group: element.elementType,
				name: element.name,
				uri: uri,
				range: element.range,
				ownerId: element.id,
			}));
			// index content of fields
			for (const field of element.fields) {
				const context: ExtractionContext = {
					schema: this.schema,
					keywords: this.keywords,
					element,
					field,
					emitters,
					receivers,
					uri,
				};
				const fieldDefinition = elementDefinition.fields[field.name];
				if (fieldDefinition) {
					this.extractEmittersAndReceivers(field.values, fieldDefinition.input, context);
				}
			}
		}
		return { emitters, receivers, };
	}

	/**
	 * Pushes extracted emitters and receivers into the c.emitters and c.receivers lists.
	 */
	private extractEmittersAndReceivers(values: ASTValue[], definition: TypeDefinition, c: ExtractionContext): true {
		if (!values.length) {
			return true;
		}
		switch (definition.type) {
			case TypeID.any:
			case TypeID.bool:
			case TypeID.float:
			case TypeID.int:
			case TypeID.range:
			case TypeID.kw:
			case TypeID.nothing:
				return true;
		
			case TypeID.id:
				c.receivers.push(makeReceiver({
					type: ERType.id,
					group: definition.group,
					name: values[0].text,
					uri: c.uri,
					range: values[0].range,
					ownerId: c.element.id,
				}));
				return true;

			case TypeID.tagEmitter:
				c.emitters.push(makeEmitter({
					type: ERType.tag,
					group: definition.group,
					name: values[0].text,
					uri: c.uri,
					range: values[0].range,
					ownerId: c.element.id,
				}));
				return true;

			case TypeID.tagReceiver:
				c.receivers.push(makeReceiver({
					type: ERType.tag,
					group: definition.group,
					name: values[0].text,
					uri: c.uri,
					range: values[0].range,
					ownerId: c.element.id,
				}));
				return true;

			case TypeID.list:
				if (definition.element.type === TypeID.sequence) {
					const sequenceLength = definition.element.elements.length;
					for (let i = 0; i < values.length; i += sequenceLength) {
						const subValues = values.slice(i, i + sequenceLength);
						this.extractEmittersAndReceivers(subValues, definition.element, c);
					}
				}
				else {
					for (const value of values) {
						this.extractEmittersAndReceivers([value], definition.element, c);
					}
				}
				return true;

			case TypeID.sequence:
				for (let i = 0; i < definition.elements.length; i++) {
					if (i >= values.length) {
						// if sequence is incomplete
						break;
					}
					if (definition.elements[i].type === TypeID.list) {
						this.extractEmittersAndReceivers(values.slice(i), definition.elements[i], c);
					}
					else {
						this.extractEmittersAndReceivers([values[i]], definition.elements[i], c);
					}
				}
				return true;

			case TypeID.union:
				// It isn't possible to know what, for example, m_TokenGlossaryHeroTag refers to, without knowing all declared IDs and tags in prior.
				// Despite its name, this field accepts references to both tags and IDs of heroes.
				// Since reference indexing only affects what elements will be revalidated, this function tries to gather as many references as it can.
				// It is supposed that emitters (these directly affect the results of validation) are not declared in ambiguous environment.
				for (const type of definition.elements) {
					this.extractEmittersAndReceivers(values, type, c);
				}
				return true;

			case TypeID.dependentRequired:
			case TypeID.dependent:
				const influencedTypes = getDependencyInfluencedType(c.element, c.field, definition, c.schema, c.keywords);
				if (!influencedTypes) {
					return true;
				}
				for (let i = 0; i < influencedTypes.types.length; i++) {
					const influencedType = influencedTypes.types[i];
					if (!influencedType) {
						continue;
					}
					const influencedValues = influencedTypes.isDependentOnList ? c.field.values.slice(i, i + 1) : c.field.values;
					this.extractEmittersAndReceivers(influencedValues, influencedType, c);
				}
				return true;

			case TypeID.sub:
				try {
					const KWGroup = c.keywords[definition.group];
					const valueDesc = KWGroup[values[0].text];
					const derivedType = valueDesc.influences?.[definition.subtypeString];
					if (!derivedType) {
						return true;
					}
					this.extractEmittersAndReceivers([values[1]], derivedType.input, c);
					if (!definition.subtypeValueType) {
						return true;
					}
					this.extractEmittersAndReceivers([values[2]], definition.subtypeValueType, c);
				}
				finally {
					return true;
				}

			case TypeID.psv:
				const psValues = parsePSV(values[0]);
				this.extractEmittersAndReceivers(psValues, definition.element, c);
				return true;

			default:
				return true;
		}
	}
}

interface ExtractionContext {
	readonly schema: FieldsDescription,
	readonly keywords: ValuesDescription,
	readonly element: ASTElement;
	readonly field: ASTField;
	readonly emitters: Emitter[];
	readonly receivers: Receiver[];
	readonly uri: UriString,
}

export function erTypeToVerbose(t: ERType) {
	switch (t) {
		case ERType.id:
			return "ID";
		case ERType.tag:
			return "Tag";
	}
}
