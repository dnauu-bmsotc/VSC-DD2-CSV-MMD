import { FieldsDescription, TypeDefinition } from './schema';
import { ASTElement, ASTValue } from './parser';

export interface Index {
	idGroups: Record<string, string[]>;
	tagGroups: Record<string, string[]>;
}

export function newIndex(): Index {
	return {
		idGroups: {},
		tagGroups: {},
	}
}

export function indexElements(index: Index, schema: FieldsDescription, elements: ASTElement[]) {
	for (const element of elements) {
		if (element.elementType === "KingdomMap") {
			continue;
		}
		if (!index.idGroups[element.elementType]) {
			index.idGroups[element.elementType] = [];
		}
		if (!index.idGroups[element.elementType].includes(element.name)) {
			index.idGroups[element.elementType].push(element.name);
		}
		const elementDefinition = schema[element.elementType];
		if (!elementDefinition) {
			console.log(`Unknown element type: ${element.elementType}.`);
			continue;
		}
		for (const field of element.fields) {
			if (!field.name) {
				// line starts with a comma
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				console.log(`Unknown field: ${field.name}, in element ${element.name}`);
				continue;
			}
			extractEmittedTags(index, field.values, fieldDefinition.input);
		}
	}
}

function extractEmittedTags(index: Index, values: ASTValue[], definition: TypeDefinition) {
	switch (definition.type) {
		case "tagEmitter":
			if (!index.tagGroups[definition.group]) {
				index.tagGroups[definition.group] = [];
			}
			if (!index.tagGroups[definition.group].includes(values[0].text)) {
				index.tagGroups[definition.group].push(values[0].text);
			}
			break;
		case "list":
			if (definition.element.type === "sequence") {
				const sequenceLength = definition.element.elements.length;
				for (let i = 0; i < values.length; i += sequenceLength) {
					if (i + sequenceLength > values.length) {
						console.log(`incomplete sequence ${values.map(v => v.text)}`);
					}
					extractEmittedTags(index, values.slice(i, i + sequenceLength), definition.element);
				}
			}
			else {
				for (const value of values) {
					extractEmittedTags(index, [value], definition.element);
				}
			}
			break;
		case "sequence":
			for (let i = 0; i < definition.elements.length; i++) {
				if (i >= values.length) {
					console.log(`incomplete sequence ${values.map(v => v.text)}`);
				}
				extractEmittedTags(index, [values[i]], definition.elements[i]);
			}
			break;
		case "union":
			// union is not processed because no tag emitters are unionized
		default:
			break;
	}
}