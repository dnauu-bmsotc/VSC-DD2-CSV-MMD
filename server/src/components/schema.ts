import * as XLSX from 'xlsx';
import { existsSync } from 'fs';

export type TypeDefinitionSolved = 
	| TypeDefinitionInt
	| TypeDefinitionRange
	| TypeDefinitionFloat
	| TypeDefinitionBool
	| TypeDefinitionID
	| TypeDefinitionKW
	| TypeDefinitionTagEmitter
	| TypeDefinitionTagReceiver
	| TypeDefinitionAny
	| TypeDefinitionNothing
	| TypeDefinitionUnionSolved;

export type TypeDefinition =
	| TypeDefinitionSolved
	| TypeDefinitionList
	| TypeDefinitionSequence
	| TypeDefinitionDependent
	| TypeDefinitionDependentRequired
	| TypeDefinitionSubtype
	| TypeDefinitionPSV
	| TypeDefinitionUnion;

export enum TypeID {
	int, range, float, bool, id, kw,
	tagEmitter, tagReceiver, list, sequence,
	union, unionSolved,
	dependent, dependentRequired,
	any, nothing, sub, psv,
}

export type TypeDefinitionInt				= { type: TypeID.int; };
export type TypeDefinitionRange				= { type: TypeID.range; };
export type TypeDefinitionFloat				= { type: TypeID.float; };
export type TypeDefinitionBool				= { type: TypeID.bool; };
export type TypeDefinitionID				= { type: TypeID.id; group: string; };
export type TypeDefinitionKW				= { type: TypeID.kw; group: string; };
export type TypeDefinitionTagEmitter 		= { type: TypeID.tagEmitter; group: string; };
export type TypeDefinitionTagReceiver		= { type: TypeID.tagReceiver; group: string; };
export type TypeDefinitionList				= { type: TypeID.list; element: TypeDefinition; };
export type TypeDefinitionSequence			= { type: TypeID.sequence; elements: TypeDefinition[]; };
export type TypeDefinitionUnion				= { type: TypeID.union; elements: TypeDefinition[]; };
export type TypeDefinitionUnionSolved		= { type: TypeID.unionSolved; elements: TypeDefinitionSolved[]; };
export type TypeDefinitionDependent			= { type: TypeID.dependent; field: string; };
export type TypeDefinitionDependentRequired	= { type: TypeID.dependentRequired; field: string; };
export type TypeDefinitionAny				= { type: TypeID.any; };
export type TypeDefinitionNothing			= { type: TypeID.nothing; };
export type TypeDefinitionSubtype			= { type: TypeID.sub; group: string, subtypeString: string, subtypeValueType: TypeDefinition };
export type TypeDefinitionPSV				= { type: TypeID.psv, element: TypeDefinition };

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
	try {
		return parseTypeRecursive(input, false);
	}
	catch (error) {
		console.error(`Error while parsing ${input}`);
		console.error(error);
		return { type: TypeID.any };
	}
}

function parseTypeRecursive(input: string, isAmbiguous: boolean): TypeDefinition {
	const defaultReturnValue: TypeDefinitionAny = { type: TypeID.any };
	input = input.trim();
	function inputMatchFunc(funcName: string): string | null {
		if (input.startsWith(`${funcName}(`) && input.endsWith(")")) {
			return input.slice(`${funcName}(`.length, input.length - 1);
		}
		return null;
	}
	if (input.match(/^range$/)) {
		return { type: TypeID.range };
	}
	if (input.match(/^int$/)) {
		return { type: TypeID.int };
	}
	if (input.match(/^float$/)) {
		return { type: TypeID.float };
	}
	if (input.match(/^bool$/)) {
		return { type: TypeID.bool };
	}
	if (input.match(/^.* ID$/)) {
		const group = input.match(/(.*) ID$/)?.[1];
		return { type: TypeID.id, group: group ? group : "" };
	}
	if (input.match(/^.* KW$/)) {
		const group = input.match(/(.*) KW$/)?.[1];
		return { type: TypeID.kw, group: group ? group : "" };
	}
	if (input.match(/^.* Tag\+$/)) {
		if (isAmbiguous) {
			console.error(`Tag emitters cannot be used in ambiguous expressions.`);
			return defaultReturnValue;
		}
		const group = input.match(/(.*) Tag\+$/)?.[1];
		return { type: TypeID.tagEmitter, group: group ? group : "" };
	}
	if (input.match(/^.* Tag-$/)) {
		const group = input.match(/(.*) Tag-$/)?.[1];
		return { type: TypeID.tagReceiver, group: group ? group : "" };
	}
	const inputMatchFuncList = inputMatchFunc("List");
	if (inputMatchFuncList) {
		const element = parseTypeRecursive(inputMatchFuncList?? "", isAmbiguous);
		return { type: TypeID.list, element: element ? element : { type: TypeID.nothing } };
	}
	const inputMatchFuncPSV = inputMatchFunc("PSV");
	if (inputMatchFuncPSV) {
		const element = parseTypeRecursive(inputMatchFuncPSV?? "", isAmbiguous);
		return { type: TypeID.psv, element: element ? element : { type: TypeID.nothing } };
	}
	const inputMatchFuncDepReq = inputMatchFunc("Dep*");
	if (inputMatchFuncDepReq) {
		return { type: TypeID.dependentRequired, field: inputMatchFuncDepReq ?? "" };
	}
	const inputMatchFuncDep = inputMatchFunc("Dep");
	if (inputMatchFuncDep) {
		return { type: TypeID.dependent, field: inputMatchFuncDep ?? "" };
	}
	const inputMatchFuncSeq = inputMatchFunc("Seq");
	if (inputMatchFuncSeq) {
		const elements = splitTopLevel(inputMatchFuncSeq).map(p => parseTypeRecursive(p.trim(), isAmbiguous));
		return { type: TypeID.sequence, elements };
	}
	const inputMatchFuncOr = inputMatchFunc("Or");
	if (inputMatchFuncOr) {
		const content = inputMatchFuncOr;
		const elements = splitTopLevel(content).map(p => parseTypeRecursive(p.trim(), true));
		return { type: TypeID.union, elements: elements };
	}
	const inputMatchFuncSub = inputMatchFunc("Sub");
	if (inputMatchFuncSub) {
		const content = inputMatchFuncSub;
		const elements = content.split(",");
		if (!elements || elements.length !== 3) {
			console.error(`Subtype ${input} needs to have 3 elements.`);
			return defaultReturnValue;
		}
		const firstElementDefinition = parseTypeRecursive(elements[0], isAmbiguous);
		if (firstElementDefinition.type !== TypeID.kw) {
			console.error(`Subtype ${input} needs a keyword group as the first type`);
			return defaultReturnValue;
		}
		return {
			type: TypeID.sub,
			group: firstElementDefinition.group,
			subtypeString: elements[1],
			subtypeValueType: parseTypeRecursive(elements[2], isAmbiguous)
		};
	}
	if (input.match(/^any$/)) {
		return { type: TypeID.any };
	}
	if (input.match(/^nothing$/)) {
		return { type: TypeID.nothing };
	}
	console.error(`Unhandled input type: ${input}`);
	return defaultReturnValue;
}

export function readFieldsDescription(filePath: string): FieldsDescription {
	if (!existsSync(filePath)) {
		throw new Error(`File not found ${filePath}`);
	}
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
			const inputString = field["Input Type"] ?? "";
			const comment = field["Comment"] ?? "";
			element.fields[field["Field Name"]] = {
				inputString: inputString,
				input: parseType(inputString),
				comment: comment,
			};
		}
		result[sheetName] = element;
	}
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

/**
 * Searches for Dep or Dep* types in given definition.
 * @returns name of the field-influencer or null.
 */
export function typeHasDependent(t: TypeDefinition): string | null {
	switch (t.type) {
		case TypeID.any:
		case TypeID.bool:
		case TypeID.float:
		case TypeID.id:
		case TypeID.int:
		case TypeID.kw:
		case TypeID.nothing:
		case TypeID.range:
		case TypeID.tagEmitter:
		case TypeID.tagReceiver:
		case TypeID.sub:
			return null;
		case TypeID.dependent:
		case TypeID.dependentRequired:
			return t.field;
		case TypeID.list:
			return typeHasDependent(t.element);
		case TypeID.union:
		case TypeID.unionSolved:
		case TypeID.sequence:
			for (const subtype of t.elements) {
				const group = typeHasDependent(subtype);
				if (group) {
					return group;
				}
			}
			return null;
		case TypeID.psv:
			return typeHasDependent(t.element);
	}
}

export function typeToVerbose(t: TypeDefinition): string {
	switch (t.type) {
		case TypeID.any:
			return "Any";
		case TypeID.bool:
			return "Boolean";
		case TypeID.dependent:
			return `Dependent on ${t.field} field`;
		case TypeID.dependentRequired:
			return `Dependent on ${t.field} field (requires values)`;
		case TypeID.float:
			return "Float";
		case TypeID.id:
			return `${t.group} ID`;
		case TypeID.int:
			return "Integer";
		case TypeID.kw:
			return `${t.group} Keyword`;
		case TypeID.list:
			return `List of (${typeToVerbose(t.element)})`;
		case TypeID.nothing:
			return "None";
		case TypeID.range:
			return "Range";
		case TypeID.sequence:
			return `Sequence (${(t.elements.map(etype => typeToVerbose(etype)))})`;
		case TypeID.tagEmitter:
			return `${t.group} tag definition`;
		case TypeID.tagReceiver:
			return `${t.group} tag reference`;
		case TypeID.union:
		case TypeID.unionSolved:
			return t.elements.map(etype => typeToVerbose(etype)).join(" or ");
		case TypeID.sub:
			return `Subtype(${t.group}, ${t.subtypeString}, ${typeToVerbose(t.subtypeValueType)})`;
		case TypeID.psv:
			return `Plus-separated values`;
	}
}