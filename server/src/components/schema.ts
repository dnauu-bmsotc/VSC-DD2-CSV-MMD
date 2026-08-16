import * as XLSX from 'xlsx';

export type TypeDefinition =
	| { type: "int"; }
	| { type: "range"; }
	| { type: "float"; }
	| { type: "bool"; }
	| { type: "id"; group: string; }
	| { type: "kw"; group: string; }
	| { type: "tagEmitter"; group: string; }
	| { type: "tagReceiver"; group: string; }
	| { type: "list"; element: TypeDefinition; }
	| { type: "sequence"; elements: TypeDefinition[]; }
	| { type: "union"; elements: TypeDefinition[]; }
	| { type: "dependent"; field: string; }
	| { type: "localization"; }
	| { type: "any"; }
	| { type: "nothing"; }

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
	if (input.match(funcRegEx("Seq"))) {
		const content = input.match(funcRegEx("Seq"))?.[1];
		const elements = content?.split(',').map(p => parseType(p.trim()));
		return { type: "sequence", elements: elements ? elements : [] };
	}
	if (input.match(funcRegEx("Dep"))) {
		const field = input.match(funcRegEx("Dep"))?.[1];
		return { type: "dependent", field: field ? field : "" };
	}
	if (input.match(/^Localization$/)) {
		return { type: "localization" };
	}
	if (input.match(/^any$/)) {
		return { type: "any" };
	}
	if (input.match(/^.*\|.*$/)) {
		const elements = input.split("|").map(p => parseType(p));
		return { type: "union", elements: elements };
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