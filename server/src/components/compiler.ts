import path from 'path';
import * as fs from 'node:fs/promises'; 
import * as XLSX from 'xlsx';

import { FieldsDescription, parseType, readFieldsDescription, TypeDefinition } from './schema';
import { Index, indexElements } from './indexer';
import { parseIntoAST } from './parser';

const streamingAssetsPath = 'C:/Program Files (x86)/Steam/steamapps/common/Darkest Dungeon® II/Darkest Dungeon II_Data/StreamingAssets/Excel'
const outputFilePath = path.resolve(__dirname, '../../../CSV Description/data_compiled.json');
const fieldsDescriptionPath = path.resolve(__dirname, '../../../CSV Description/CSV Fields.ods');
const valuesDescriptionPath = path.resolve(__dirname, '../../../CSV Description/CSV Values.ods');
const elementsDescriptionPath = path.resolve(__dirname, '../../../CSV Description/CSV Elements.ods');

interface CompiledData {
	schema: FieldsDescription;
	index: Index;
	keywords: ValuesDescription;
	elementsDescription: ElementsDescription;
}

type ValuesDescription = Record<string, KWGroup>;

type KWGroup = Record<string, ValueDescription>;

interface ValueDescription {
	influences?: Record<string, {
		inputString: string;
		input: TypeDefinition;
	}>;
	comment?: string;
};

interface ElementDescription {
	comment?: string;
}

type ElementsDescription = Record<string, ElementDescription>;

compileData(true);

export async function compileData(log=false): Promise<CompiledData> {
	const t0 = performance.now();
	const schema = readFieldsDescription(fieldsDescriptionPath);
	const index: Index = {
		idGroups: {},
		tagGroups: {},
	}

	const csvFiles = await findCsvFiles(streamingAssetsPath);
	for (const file of csvFiles) {
		const data = await fs.readFile(path.resolve(file), 'utf-8');
		const parseResult = parseIntoAST(data, undefined, false);
		indexElements(index, schema, parseResult.AST.elements)
	}

	const keywords = readValuesDescription(valuesDescriptionPath);

	const elementsDescription = readElementsDescription(elementsDescriptionPath);

	const result: CompiledData = {
		schema,
		index,
		keywords,
		elementsDescription,
	}

	const jsonString = JSON.stringify(result, null, 2);
	await fs.writeFile(outputFilePath, jsonString, 'utf-8');

	if (log) {
		console.log(`Compiling data: ${(performance.now() - t0).toFixed(1)} ms`);
	}
	return result;
}

async function findCsvFiles(folderPath: string) {
	const entries = await fs.readdir(folderPath, { recursive: true });
	const csvFiles = entries
		.filter((file) => path.extname(file).toLowerCase() === '.csv')
		.map((file) => path.join(folderPath, file));
	return csvFiles;
}

function readValuesDescription(filePath: string): ValuesDescription {
	const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
	const result: ValuesDescription = {};

	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		const data: any[] = XLSX.utils.sheet_to_json(sheet);
		result[sheetName] = {}
		const kwGroup = result[sheetName];

		for (const line of data) {
			kwGroup[line["Value"]] = {}
			for (const field of Object.keys(line)) {
				if (field === "Value") {
				}
				else if (field === "Comment") {
					kwGroup[line["Value"]].comment = line[field];
				}
				else {
					if (!kwGroup[line["Value"]].influences) {
						kwGroup[line["Value"]].influences = {};
					}
					const influences = kwGroup[line["Value"]].influences;
					if (influences) {
							influences[field] = {
							inputString: line[field],
							input: parseType(line[field]),
						}
					}
				}
			}
		}
	}

	return result;
}

function readElementsDescription(filePath: string): ElementsDescription {
	const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
	const result: ElementsDescription = {};

	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		const data: any[] = XLSX.utils.sheet_to_json(sheet);
		for (const line of data) {
			result[line["Element Type"]] = {}
			const v = result[line["Element Type"]];
			for (const field in line) {
				if (field === "Element Type") {
				}
				else if (field === "Comment") {
					v.comment = line[field];
				}
			}
		}
	}

	return result;
}