import { FieldsDescription, TypeDefinition } from './schema';
import { ASTElement, ASTField, ASTValue } from './parser';
import { ValuesDescription } from './compiler';

export interface Index {
	idGroups: IndexGroups;
	tagGroups: IndexGroups;
}

export type IndexGroups = Record<string, string[]>;

export function newIndex(): Index {
	return {
		idGroups: {},
		tagGroups: {},
	}
}

export function indexElements(index: Index, schema: FieldsDescription, elements: ASTElement[], keywords: ValuesDescription) {
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
			console.error(`Unknown element type: ${element.elementType}.`);
			continue;
		}
		for (const field of element.fields) {
			if (!field.name) {
				// line starts with a comma
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				console.error(`Unknown field: ${field.name}, in element ${element.name}`);
				continue;
			}
			extractEmittedTags(index, element, field, field.values, fieldDefinition.input, schema, keywords);
		}
	}
}

function extractEmittedTags(index: Index, element: ASTElement, field: ASTField, values: ASTValue[], definition: TypeDefinition, schema: FieldsDescription, keywords: ValuesDescription) {
	switch (definition.type) {
		case "tagEmitter":
			if (!values.length) {
				break;
			}
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
						console.error(`incomplete sequence ${values.map(v => v.text)}`);
					}
					extractEmittedTags(index, element, field, values.slice(i, i + sequenceLength), definition.element, schema, keywords);
				}
			}
			else {
				for (const value of values) {
					extractEmittedTags(index, element, field, [value], definition.element, schema, keywords);
				}
			}
			break;
		case "sequence":
			for (let i = 0; i < definition.elements.length; i++) {
				if (i >= values.length) {
					console.error(`incomplete sequence ${values.map(v => v.text)}`);
				}
				extractEmittedTags(index, element, field, [values[i]], definition.elements[i], schema, keywords);
			}
			break;
		case "union":
			// union is not processed because no tag emitters are unionized
			break;
		case "dependentRequired":
		case "dependent":
			try {
				const influenceSourceField = element.fields.find(f => f.name === definition.field);
				if (influenceSourceField) {
					const influenceSourceSchema = schema[element.elementType].fields[influenceSourceField.name].input;
					const influenceSourceSchemaContent = influenceSourceSchema.type === "list" ? influenceSourceSchema.element : influenceSourceSchema;
					if (influenceSourceSchemaContent.type === "kw") {
						const influenceKWGroup = keywords[influenceSourceSchemaContent.group];
						for (let i = 0; i < influenceSourceField.values.length; i++) {
							const sourceValue = influenceSourceField.values[i];
							const influenceValueDesc = influenceKWGroup[sourceValue.text];
							if (influenceValueDesc?.influences) {
								const influenceType = influenceValueDesc.influences?.[element.elementType + " " + field.name];
								if (influenceType) {
									const influencedValues = influenceSourceSchema.type === "list" ? field.values.slice(i, i + 1) : field.values;
									extractEmittedTags(index, element, field, influencedValues, influenceType.input, schema, keywords);
								}
							}
						}
					}
				}
			}
			catch(error) {
				if (error instanceof Error) {
					console.error(`Error during tag extraction from dependent fields`);
					console.log(error);
				}
			}
			break;
		default:
			break;
	}
}