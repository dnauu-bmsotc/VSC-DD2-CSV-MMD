import * as path from 'path';
import * as fs from 'node:fs/promises'; 
import * as XLSX from 'xlsx';
import { existsSync } from 'fs';

import { FieldsDescription, parseType, readFieldsDescription, TypeDefinition } from './schema';
import { Index, indexElements, newIndex } from './indexer';
import { parseIntoAST } from './parser';
import { dataCompiledOutputFilePath, fieldsDescriptionPath, streamingAssetsPath, valuesDescriptionPath, elementsDescriptionPath } from '../../../shared/projectPaths';
import { defaultConfiguration } from '../../../shared/settings';

export interface CompiledData {
	schema: FieldsDescription;
	index: Index;
	keywords: ValuesDescription;
	elementsDescription: ElementsDescription;
}

export type ValuesDescription = Record<string, KWGroup>;

export type KWGroup = Record<string, ValueDescription>;

interface ValueDescription {
	influences?: Record<string, {
		inputString: string;
		input: TypeDefinition;
	}>;
	comment?: string;
};

export interface ElementDescription {
	comment?: string;
}

type ElementsDescription = Record<string, ElementDescription>;

export async function getCompiledData(rebuild=false) {
	if (!rebuild) {
		const json = await readJson<CompiledData>(dataCompiledOutputFilePath);
		if (json) return json;
	}
	return await compileData();
}

export async function compileData(): Promise<CompiledData> {
	const t0 = performance.now();
	const schema = readFieldsDescription(fieldsDescriptionPath);
	const keywords = readValuesDescription(valuesDescriptionPath);
	const elementsDescription = readElementsDescription(elementsDescriptionPath);

	const index = newIndex();
	const csvFiles = await findCsvFiles(streamingAssetsPath);
	for (const file of csvFiles) {
		const data = await fs.readFile(path.resolve(file), 'utf-8');
		const parseResult = parseIntoAST(data, defaultConfiguration);
		indexElements(index, schema, parseResult.AST, keywords);
	}

	const result: CompiledData = {
		schema,
		index,
		keywords,
		elementsDescription,
	}

	const jsonString = JSON.stringify(result, null, 2);
	await fs.writeFile(dataCompiledOutputFilePath, jsonString, 'utf-8');
	console.info(`Compiling data: ${(performance.now() - t0).toFixed(1)} ms.`);
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
	if (!existsSync(filePath)) {
		throw new Error(`File not found ${filePath}`);
	}
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
	if (!existsSync(filePath)) {
		throw new Error(`File not found ${filePath}`);
	}
	const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
	const result: ElementsDescription = {};

	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		const data: any[] = XLSX.utils.sheet_to_json(sheet);
		for (const line of data) {
			result[line["Element Type"]] = {};
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

async function readJson<T>(filePath: string): Promise<T | null> {
	try {
		const rawData = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(rawData) as T;
	}
	catch (error: any) {
		throw Error(`File not found: ${filePath}`);
	}
}