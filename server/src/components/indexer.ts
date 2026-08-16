import path from 'path';
import * as fs from 'node:fs/promises'; 
import { readFieldsDescription, TypeDefinition } from './schema';
import { ASTElement, ASTValue, parseIntoAST } from './parser';
import { DD2CSVMMDSettings } from './configuration';

const outputFilePath = path.resolve(__dirname, '../../../CSV Description/Index_vanilla.json');
const streamingAssetsPath = 'C:/Program Files (x86)/Steam/steamapps/common/Darkest Dungeon® II/Darkest Dungeon II_Data/StreamingAssets/Excel'
const fieldsDescriptionPath = path.resolve(__dirname, '../../../CSV Description/CSV Fields.ods');

const schema = readFieldsDescription(fieldsDescriptionPath);

interface Index {
	idGroups: Record<string, string[]>;
	tagGroups: Record<string, string[]>;
}

indexFolderIntoFile(streamingAssetsPath, outputFilePath, {validateElementBoundaries: true});

async function indexFolderIntoFile(folderPath: string, outputPath: string, configuration: DD2CSVMMDSettings) {
	const index: Index = {
		idGroups: {},
		tagGroups: {},
	}

	const csvFiles = await findCsvFiles(folderPath);
	for (const file of csvFiles) {
		const data = await fs.readFile(path.resolve(file), 'utf-8');
		const parseResult = parseIntoAST(data, configuration);
		indexElements(index, parseResult.AST.elements)
	}

	const jsonString = JSON.stringify(index, null);

	await fs.writeFile(outputFilePath, jsonString, 'utf-8');
}

function indexElements(index: Index, elements: ASTElement[]) {
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

async function findCsvFiles(folderPath: string) {
	const entries = await fs.readdir(folderPath, { recursive: true });
    const csvFiles = entries
		.filter((file) => path.extname(file).toLowerCase() === '.csv')
		.map((file) => path.join(folderPath, file));
	return csvFiles;
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
						console.log(`incomplete sequence ${values.map(v => v.text)}`)
						console.log(values.length)
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