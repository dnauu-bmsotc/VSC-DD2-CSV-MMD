import { FieldsDescription, TypeDefinition, TypeDefinitionDependent, TypeDefinitionDependentRequired } from './schema';
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
			continue;
		}
		for (const field of element.fields) {
			if (!field.name) {
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
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
						// if incomplete sequence
						break;
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
					// if incomplete sequence
					break;
				}
				extractEmittedTags(index, element, field, [values[i]], definition.elements[i], schema, keywords);
			}
			break;
		case "union":
			// union is not processed because no tag emitters are unionized
			break;
		case "dependentRequired":
		case "dependent":
			const influencedTypes = getDependencyInfluencedTypeSilent(element, field, definition, schema, keywords);
			if (!influencedTypes) {
				break;
			}
			for (let i = 0; i < influencedTypes.types.length; i++) {
				const influencedType = influencedTypes.types[i];
				if (!influencedType) {
					continue;
				}
				const influencedValues = influencedTypes.isDependentOnList ? field.values.slice(i, i + 1) : field.values;
				extractEmittedTags(index, element, field, influencedValues, influencedType, schema, keywords);
			}
			break;
		default:
			break;
	}
}


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
	};
}

