import * as XLSX from 'xlsx';

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
	| TypeDefinitionLocalization
	| TypeDefinitionAny
	| TypeDefinitionNothing;

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
export type TypeDefinitionLocalization = { type: "localization"; };
export type TypeDefinitionAny = { type: "any"; };
export type TypeDefinitionNothing = { type: "nothing"; };

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
	if (input.match(/^Localization$/)) {
		return { type: "localization" };
	}
	if (input.match(/^any$/)) {
		return { type: "any" };
	}
	if (input.match(/^nothing$/)) {
		return { type: "nothing" };
	}
	console.log(`Unhandled input type: ${input}`);
	return { type: "nothing" };
}

export function readFieldsDescription(filePath: string): FieldsDescription {
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
	console.log(`Read schema: ${(performance.now() - t0).toFixed(1)} ms`);
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