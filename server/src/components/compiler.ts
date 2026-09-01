import * as XLSX from 'xlsx';
import { existsSync } from 'fs';
import { FieldsDescription, parseType, readFieldsDescription, TypeDefinition } from './schema';
import { fieldsDescriptionPath, valuesDescriptionPath, elementsDescriptionPath } from '../../../shared/projectPaths'

export interface CompiledData {
	schema: FieldsDescription;
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

export async function compileData(): Promise<CompiledData> {
	const t0 = performance.now();
	const schema = readFieldsDescription(fieldsDescriptionPath);
	const keywords = readValuesDescription(valuesDescriptionPath);
	const elementsDescription = readElementsDescription(elementsDescriptionPath);
	const result: CompiledData = {
		schema,
		keywords,
		elementsDescription,
	}
	console.info(`Compiled data [${(performance.now() - t0).toFixed(1)} ms].`);
	return result;
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