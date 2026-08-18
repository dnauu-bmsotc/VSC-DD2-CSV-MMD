import * as path from 'path';
import * as fs from 'node:fs/promises';
import { CompiledData } from './compiler';
import { Field, TypeDefinition } from './schema';
import { readmeBaseFilePath, readmeOutputFilePath } from '../../../shared/projectPaths';

export async function assembleReadme(compiledData: CompiledData) {
	let readme = await fs.readFile(readmeBaseFilePath, 'utf-8');
	
	readme += "\n\n# CSV data description\n\n";

	readme += generateFieldsDescription(compiledData);
	
	await fs.writeFile(readmeOutputFilePath, readme, 'utf-8');
}

function generateFieldsDescription(compiledData: CompiledData): string {
	let result = "";
	for (const elementType of Object.keys(compiledData.schema)) {
		const element = compiledData.schema[elementType];
		const elementDesc = compiledData.elementsDescription[elementType].comment;
		result += `
<details>
<summary><b>${element.name}</b></summary>
${elementDesc ? elementDesc + "\n" : ""}
| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |`
for (const fieldName of Object.keys(element.fields)) {
	const field = element.fields[fieldName];
	const keywords = getInputKeywords(field, compiledData);
	const inputTypeString = keywords.modifiedInputString
		.replaceAll(" ", "&nbsp;")
		.replaceAll(",", ", ")
		.replaceAll(/\bint\b/g, "integer")
		.replaceAll(/\bbool\b/g, "boolean")
		.replaceAll(/\bany\b/g, "");
	let valuesString = "";
	for (const g of keywords.groups) {
		valuesString += `${g.groupName}: `;
		if (g.values.join("").length < 500) {
			valuesString += `${g.values.join(", ")}`;
		}
		else {
			valuesString += `<details><summary>expand</summary>${g.values.join(", ")}</details>`;
		}
		valuesString += `<br>`;
	}
	result += `\n|${fieldName}|${inputTypeString}|${field.comment}|${valuesString}|`
}
result += `
</details>
`
	}
	return result;
}

interface InputKeywordsFunctionResult {
	modifiedInputString: string;
	groups: {
		groupName: string;
		values: string[];
	}[];
}

function getInputKeywords(field: Field, compiledData: CompiledData): InputKeywordsFunctionResult {
	const keywordGroups = [... new Set(getInputKeywordsRecursive(field.input))];
	const result: InputKeywordsFunctionResult = {
		modifiedInputString: field.inputString,
		groups: [],
	}
	for (const [index, value] of [...keywordGroups].entries()) {
		const alias = keywordGroups.length === 1 ? "keyword" : `keyword${index + 1}`;
		result.modifiedInputString = result.modifiedInputString.replaceAll(value + " KW", alias);
		const kwgroup = compiledData.keywords[value];
		if (!kwgroup) {
			console.log(`README: Unknown keyword group ${value}`);
			continue;
		}
		result.groups.push({
			groupName: alias,
			values: Object.keys(kwgroup).toSorted(),
		});
	}

	return result;
}

function getInputKeywordsRecursive(content: TypeDefinition): string[] {
	switch (content.type) {
		case "kw":
			return [ content.group ];
		case "list":
			return getInputKeywordsRecursive(content.element);
		case "sequence":
		case "union":
			return content.elements.map(x => getInputKeywordsRecursive(x)).flat();
		default:
			return [];
	}
}

