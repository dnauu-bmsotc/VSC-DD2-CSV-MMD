import { ASTElement, ElementNumberID } from './parser';
import { Range } from 'vscode-languageserver';
import { Brand, UriString } from '../../../shared/utils';
import { FieldsDescription } from './schema';
import { ValuesDescription } from './compiler';

export type EmitterType = "id" | "tag";
export type ReceiverType = EmitterType;

export interface EmitterOrReceiverBase {
	type: EmitterType;
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

export function makeEmitter({ type, group, name, uri, range }: EmitterOrReceiverBase): Emitter {
	return { type, group, name, uri, range } as Emitter;
}

export function makeReceiver({ type, group, name, uri, range }: EmitterOrReceiverBase): Receiver {
	return { type, group, name, uri, range } as Receiver;
}

function getKey(info: KeyInfo) {
	return `${info.type}:${info.group}:${info.name}`;
}

export interface ElementIndexData {
	emitters: Emitter[],
	receivers: Receiver[],
}

export class Index {
	private readonly emittersByKey = new Map<string, Emitter[]>();
	private readonly receiversByKey = new Map<string, Receiver[]>();

	private readonly emittersByElement = new Map<ElementNumberID, Emitter[]>();
	private readonly receiversByElement = new Map<ElementNumberID, Receiver[]>();

	constructor(
		private readonly schema: FieldsDescription,
		private readonly keywords: ValuesDescription,
	) {}

	public removeElement(id: ElementNumberID) {
		const affectedElements = this.findElementsDependentOnEmittersOfAnElement(id);
		this.removeElementFromKeyList(id, this.emittersByKey, this.emittersByElement);
		this.removeElementFromKeyList(id, this.receiversByKey, this.receiversByElement);
		this.emittersByElement.delete(id);
		this.receiversByElement.delete(id);
		return affectedElements;
	}

	public addElement(id: ElementNumberID, emitters: Emitter[], receivers: Receiver[]) {
		const affectedElements = new Set<ElementNumberID>();
		this.emittersByElement.set(id, emitters);
		this.receiversByElement.set(id, receivers);
		this.addElementToKeyList(emitters, this.emittersByKey);
		this.addElementToKeyList(receivers, this.receiversByKey);
		// newly added emitter can resolve references
		for (const emitter of emitters) {
			const key = getKey(emitter);
			for (const receiver of this.receiversByKey.get(key) ?? []) {
				if (receiver.ownerId !== id) {
					affectedElements.add(receiver.ownerId);
				}
			}
		}
		return affectedElements;
	}

	public findEmitters(info: KeyInfo): Emitter[] {
		return [...this.emittersByKey.get(getKey(info)) ?? []];
	}

	public findReceivers(info: KeyInfo): Receiver[] {
		return [...this.receiversByKey.get(getKey(info)) ?? []];
	}

	private findElementsDependentOnEmittersOfAnElement(id: ElementNumberID) {
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
		return affectedElements;
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

	public indexElement(element: ASTElement): ElementIndexData {
		const emitters: Emitter[] = [];
		const receivers: Receiver[] = [];
		const elementDefinition = this.schema[element.elementType];
		if (elementDefinition) {
			for (const field of element.fields) {
				const fieldDefinition = elementDefinition.fields[field.name];
				if (fieldDefinition) {

				}
			}
		}
		return { emitters, receivers, };
	}
}