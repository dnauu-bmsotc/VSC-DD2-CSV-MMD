import { ERType, Index } from '.';
import { FieldsDescription } from './schema';

export function get(schema: FieldsDescription, index: Index): string {
	return printElementTypesWithSameID(schema, index);
}

function printElementTypesWithSameID(schema: FieldsDescription, index: Index): string {
	const elementTypes = Object.keys(schema);
	const dossier: Record<string,Set<string>> = {};
	for (const element of index.getElements()) {
		if (!Object.hasOwn(dossier, element.elementType)) {
			dossier[element.elementType] = new Set();
		}
		for (const elementType of elementTypes) {
			if (element.elementType === elementType) {
				continue;
			}
			const key = { type: ERType.id, group: elementType, name: element.name };
			const emitters = index.findEmittersForAllGameTypes(key);
			if (emitters.length > 0) {
				dossier[element.elementType].add(elementType);
			}
		}
	}
	let result = `Element types guilty of having the same ID:`;
	for (const t of [...Object.keys(dossier)].toSorted()) {
		result += `\n- ${t}: ${[...dossier[t]].join(',')}`;
	}
	return result;
}