import * as XLSX from 'xlsx';
import * as path from 'node:path';
import { existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { fieldsDescriptionPath, elementsDescriptionPath, valuesDescriptionPath, compiledDataGSRelative } from '../../../shared/projectPaths';

export type TypeDefinitionBasic = 
	| TypeDefinitionInt
	| TypeDefinitionRange
	| TypeDefinitionFloat
	| TypeDefinitionBool
	| TypeDefinitionID
	| TypeDefinitionKW
	| TypeDefinitionTagEmitter
	| TypeDefinitionTagReceiver
	| TypeDefinitionAny
	| TypeDefinitionNothing;

export type TypeDefinition =
	| TypeDefinitionBasic
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
	union, unionBasic, dependent, dependentRequired,
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
export type TypeDefinitionDependent			= { type: TypeID.dependent; field: string; };
export type TypeDefinitionDependentRequired	= { type: TypeID.dependentRequired; field: string; };
export type TypeDefinitionAny				= { type: TypeID.any; };
export type TypeDefinitionNothing			= { type: TypeID.nothing; };
export type TypeDefinitionSubtype			= { type: TypeID.sub; group: string, subtypeString: string, subtypeValueType: TypeDefinition | null };
export type TypeDefinitionPSV				= { type: TypeID.psv, element: TypeDefinition };

export type Element = {
	/**
	 * element's type
	 */
	name: string;
	fields: Record<string, Field>;
	comment: string;
	addable: boolean;
	/**
	 * false to ignore this element
	 */
	process: boolean;
	/**
	 * should this element type be checked on whether it's referenced anywhere in CSV files.
	 */
	checkIfUsed: boolean;
	/**
	 * Implied element connections by the same ID.
	 * For example Buff and ActorDataStats/ActorDataEffects.
	 */
	supplementedBy: string[];
};

export type Field = {
	inputString: string;
	input: TypeDefinition;
	comment: string;
}

export interface Value {
	influences?: Record<string, {
		inputString: string;
		input: TypeDefinition;
	}>;
	comment?: string;
};

export interface CompiledData {
	schema: FieldsDescription;
	keywords: ValuesDescription;
	typeSupplementing: Map<string,Set<string>>;
	typeSupplementedBy: Map<string,Set<string>>;
	lastCompileTime: number;
}

/**
 * Record <Element Type, Element schema>
 * Element Type example: ActorDataClass
 */
export type FieldsDescription = Record<string, Element>;

/**
 * Record <Value Group, Value Group Data>
 * Value Group example: ConditionType.
 */
export type ValuesDescription = Record<string, KWGroup>;

/**
 * Record <Value String, Value Data>
 * Value String example: path_tag_amount.
 */
export type KWGroup = Record<string, Value>;


export function compileData(globalStoragePath: string): CompiledData {
	const t0 = performance.now();
	const compiledDataPath = path.join(globalStoragePath, compiledDataGSRelative);
	if (existsSync(compiledDataPath)) {
		try {
			const csvDescPaths = [elementsDescriptionPath, fieldsDescriptionPath, valuesDescriptionPath];
			const lastMTime = Math.max(...csvDescPaths.map(path => statSync(path).mtimeMs));
			const cachedData: CompiledData = JSON.parse(readFileSync(compiledDataPath, 'utf8'));
			if (lastMTime <= cachedData.lastCompileTime) {
				console.info(`Loaded cached CSV Description data [${(performance.now() - t0).toFixed(1)} ms].`);
				return cachedData;
			}
		}
		catch (error) {
			console.error('Error reading cached CSV description data.');
		}
	}
	const schema = readFieldsDescription(fieldsDescriptionPath, elementsDescriptionPath);
	const keywords = readValuesDescription(valuesDescriptionPath);

	const typeSupplementing = new Map<string,Set<string>>();
	const typeSupplementedBy = new Map<string,Set<string>>();
	const sameIdConnections = Object.values(schema)
		.map(d => d.supplementedBy.map(e => [d.name, e] as [string, string])).flat(1);
	for (const elementType of Object.keys(schema)) {
		typeSupplementing.set(elementType, findAncestors(sameIdConnections, elementType));
		typeSupplementedBy.set(elementType, findChildren(sameIdConnections, elementType));
	}

	const result: CompiledData = {
		schema,
		keywords,
		lastCompileTime: Date.now(),
		typeSupplementing,
		typeSupplementedBy,
	}
	writeFileSync(compiledDataPath, JSON.stringify(result));
	console.info(`Compiled data [${(performance.now() - t0).toFixed(1)} ms].`);
	return result;
}


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
		if (!elements || (elements.length !== 2) && (elements.length !== 3)) {
			console.error(`Subtype ${input} needs to have 2 or 3 elements.`);
			return defaultReturnValue;
		}
		const firstElementDefinition = parseTypeRecursive(elements[0], isAmbiguous);
		if (firstElementDefinition.type !== TypeID.kw) {
			console.error(`Subtype ${input} needs a keyword group as the first type`);
			return defaultReturnValue;
		}
		const subtypeValueType = elements.length > 2
			? parseTypeRecursive(elements[2], isAmbiguous)
			: null;
		return {
			type: TypeID.sub,
			group: firstElementDefinition.group,
			subtypeString: elements[1],
			subtypeValueType: subtypeValueType
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

export function readFieldsDescription(filePathFields: string, filePathElements: string): FieldsDescription {
	if (!existsSync(filePathFields)) {
		throw new Error(`File not found ${filePathFields}`);
	}
	if (!existsSync(filePathElements)) {
		throw new Error(`File not found ${filePathElements}`);
	}
	const workbookFields: XLSX.WorkBook = XLSX.readFile(filePathFields);
	const workbookElements: XLSX.WorkBook = XLSX.readFile(filePathElements);
	const elementsData: any[] = XLSX.utils.sheet_to_json(workbookElements.Sheets[workbookElements.SheetNames[0]]);

	const result: FieldsDescription = {};
	for (const elementType of workbookFields.SheetNames) {
		const sheet = workbookFields.Sheets[elementType];
		const fieldsData: any[] = XLSX.utils.sheet_to_json(sheet);
		const elementData = elementsData.find(line => line["Element Type"] === elementType);
		const element: Element = {
			name: elementType,
			fields: {},
			comment: elementData["Comment"],
			process: elementData["Process"] === "Yes",
			addable: elementData["Addable"] === "Yes",
			checkIfUsed: elementData["CheckIfUsed"] === "Yes",
			supplementedBy: (elementData["SupplementedBy"]?.split(',') ?? []),
		};
		for (const field of fieldsData) {
			const inputString = field["Input Type"] ?? "";
			const comment = field["Comment"] ?? "";
			element.fields[field["Field Name"]] = {
				inputString: inputString,
				input: parseType(inputString),
				comment: comment,
			};
		}
		result[elementType] = element;
	}
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
			return `${t.group} ID reference`;
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
			return t.elements.map(etype => typeToVerbose(etype)).join(" or ");
		case TypeID.sub:
			return t.subtypeValueType
				? `${t.group}, ${t.subtypeString}, ${typeToVerbose(t.subtypeValueType)}`
				: `${t.group}, ${t.subtypeString}`;
		case TypeID.psv:
			return `Plus-separated values (${typeToVerbose(t.element)})`;
	}
}

function findAncestors(edges: [string, string][], node: string): Set<string> {
	const parents = new Map<string, string[]>();
	for (const [from, to] of edges) {
		const list = parents.get(to);
		if (list) {
			list.push(from)
		}
		else {
			parents.set(to, [from])
		};
	}

	const result = new Set<string>();
	const stack = [...(parents.get(node) ?? [])];

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		stack.pop()!;
		if (result.has(current)) {
			continue;
		}
		result.add(current);
		for (const p of parents.get(current) ?? []) {
			if (!result.has(p)) {
				stack.push(p);
			}
		}
	}

	return result;
}

function findChildren(edges: [string, string][], node: string): Set<string> {
	const children = new Map<string, string[]>();
	for (const [from, to] of edges) {
		const list = children.get(from);
		if (list) {
			list.push(to);
		}
		else {
			children.set(from, [to]);
		}
	}

	const result = new Set<string>();
	const stack = [...(children.get(node) ?? [])];

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		stack.pop()!;
		if (result.has(current)) {
			continue;
		}
		result.add(current);
		for (const c of children.get(current) ?? []) {
			if (!result.has(c)) {
				stack.push(c);
			}
		}
	}

	return result;
}
