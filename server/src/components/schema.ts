import * as XLSX from 'xlsx';
import { existsSync } from 'fs';
import { logPerformanceTime } from '../../../shared/utils';

export type TypeDefinition =
	| TypeDefinitionInt
	| TypeDefinitionRange
	| TypeDefinitionFloat
	| TypeDefinitionBool
	| TypeDefinitionID
	| TypeDefinitionKW
	| TypeDefinitionTagEmitter
	| TypeDefinitionTagReceiver
	| TypeDefinitionList
	| TypeDefinitionSequence
	| TypeDefinitionUnion
	| TypeDefinitionDependent
	| TypeDefinitionDependentRequired
	| TypeDefinitionLocalization
	| TypeDefinitionAny
	| TypeDefinitionNothing
	| TypeDefinitionSubtype;

export type TypeDefinitionInt = { type: "int"; };
export type TypeDefinitionRange = { type: "range"; };
export type TypeDefinitionFloat = { type: "float"; };
export type TypeDefinitionBool = { type: "bool"; };
export type TypeDefinitionID = { type: "id"; group: string; };
export type TypeDefinitionKW = { type: "kw"; group: string; };
export type TypeDefinitionTagEmitter = { type: "tagEmitter"; group: string; };
export type TypeDefinitionTagReceiver = { type: "tagReceiver"; group: string; };
export type TypeDefinitionList = { type: "list"; element: TypeDefinition; };
export type TypeDefinitionSequence = { type: "sequence"; elements: TypeDefinition[]; };
export type TypeDefinitionUnion = { type: "union"; elements: TypeDefinition[]; };
export type TypeDefinitionDependent = { type: "dependent"; field: string; };
export type TypeDefinitionDependentRequired = Omit<TypeDefinitionDependent, "type"> & { type: "dependentRequired" };
export type TypeDefinitionLocalization = { type: "localization"; };
export type TypeDefinitionAny = { type: "any"; };
export type TypeDefinitionNothing = { type: "nothing"; };
export type TypeDefinitionSubtype = { type: "sub"; group: string, subtypeString: string, subtypeValueType: TypeDefinition };

export type Field = {
	inputString: string;
	input: TypeDefinition;
	comment: string;
}

export type Element = {
	name: string;
	fields: Record<string, Field>;
};

export type FieldsDescription = Record<string, Element>;

export function parseType(input: string): TypeDefinition {
	const defaultReturnValue = Object.freeze({ type: "any" });
	input = input.trim();
	const funcRegEx = (funcName: string) =>
		new RegExp(`^${funcName}\\(((?:[^()]+|\\([^()]*\\))*)\\)$`);
	if (input.match(/^range$/)) {
		return { type: "range" };
	}
	if (input.match(/^int$/)) {
		return { type: "int" };
	}
	if (input.match(/^float$/)) {
		return { type: "float" };
	}
	if (input.match(/^bool$/)) {
		return { type: "bool" };
	}
	if (input.match(/^.* ID$/)) {
		const group = input.match(/(.*) ID$/)?.[1];
		return { type: "id", group: group ? group : "" };
	}
	if (input.match(/^.* KW$/)) {
		const group = input.match(/(.*) KW$/)?.[1];
		return { type: "kw", group: group ? group : "" };
	}
	if (input.match(/^.* Tag\+$/)) {
		const group = input.match(/(.*) Tag\+$/)?.[1];
		return { type: "tagEmitter", group: group ? group : "" };
	}
	if (input.match(/^.* Tag-$/)) {
		const group = input.match(/(.*) Tag-$/)?.[1];
		return { type: "tagReceiver", group: group ? group : "" };
	}
	if (input.match(funcRegEx("List"))) {
		const content = input.match(funcRegEx("List"))?.[1];
		const element = parseType(content? content.trim() : "");
		return { type: "list", element: element ? element : { type: "nothing" } };
	}
	if (input.match(funcRegEx("Dep\\*"))) {
		const field = input.match(funcRegEx("Dep\\*"))?.[1];
		return { type: "dependentRequired", field: field ? field : "" };
	}
	if (input.match(funcRegEx("Dep"))) {
		const field = input.match(funcRegEx("Dep"))?.[1];
		return { type: "dependent", field: field ? field : "" };
	}
	if (input.match(funcRegEx("Seq"))) {
		const content = input.match(funcRegEx("Seq"))?.[1];
		const elements = splitTopLevel(content).map(p => parseType(p.trim()));
		return { type: "sequence", elements };
	}
	if (input.match(funcRegEx("Or"))) {
		const content = input.match(funcRegEx("Or"))?.[1];
		const elements = splitTopLevel(content).map(p => parseType(p.trim()));
		return { type: "union", elements: elements };
	}
	if (input.match(funcRegEx("Sub"))) {
		const content = input.match(funcRegEx("Sub"))?.[1];
		if (!content) {
			return defaultReturnValue;
		}
		const elements = content.split(",");
		if (!elements || elements.length !== 3) {
			console.error(`Subtype ${input} needs to have 3 elements.`);
			return defaultReturnValue;
		}
		const firstElementDefinition = parseType(elements[0]);
		if (firstElementDefinition.type !== "kw") {
			console.error(`Subtype ${input} needs a keyword group as the first type`);
			return defaultReturnValue;
		}
		return { type: "sub", group: firstElementDefinition.group, subtypeString: elements[1], subtypeValueType: parseType(elements[2]) };
	}
	if (input.match(/^Localization$/)) {
		return { type: "localization" };
	}
	if (input.match(/^any$/)) {
		return { type: "any" };
	}
	if (input.match(/^nothing$/)) {
		return { type: "nothing" };
	}
	console.error(`Unhandled input type: ${input}`);
	return defaultReturnValue;
}

export function readFieldsDescription(filePath: string): FieldsDescription {
	if (!existsSync(filePath)) {
		throw new Error(`File not found ${filePath}`);
	}
	const t0 = performance.now();
	const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
	const result: FieldsDescription = {};
	for (const sheetName of workbook.SheetNames) {
		const sheet = workbook.Sheets[sheetName];
		const data: any[] = XLSX.utils.sheet_to_json(sheet);
		const element: Element = {
			name: sheetName,
			fields: {},
		};
		for (const field of data) {
			const inputString = field["Input Type"] ? field["Input Type"] : "";
			const comment = field["Comment"] ? field["Comment"] : "";
			element.fields[field["Field Name"]] = {
				inputString: inputString,
				input: parseType(inputString),
				comment: comment,
			};
		}
		result[sheetName] = element;
	}
	logPerformanceTime("Read schema", t0);
	return result;
}

function splitTopLevel(content?: string): string[] {
	if (!content) return [];
	const parts = [];
	let current = '';
	let depth = 0;
	for (const c of content) {
		if (c === '(') depth++;
		else if (c === ')') depth--;
		else if (c === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
			continue;
		}
		current += c;
	}
	if (current) parts.push(current.trim());
	return parts;
}