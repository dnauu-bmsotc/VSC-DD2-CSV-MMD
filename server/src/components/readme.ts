import * as fs from 'node:fs/promises';
import { CompiledData, Element, Field, TypeDefinition, TypeID } from './schema';
import { readmeBaseFilePath, readmeOutputFilePath } from '../../../shared/projectPaths';

export async function assembleReadme(compiledData: CompiledData) {
	let readme = await fs.readFile(readmeBaseFilePath, 'utf-8');
	
	readme = readme.replace("_DD2CSVMMDDescription", generateFieldsDescription(compiledData));
	
	await fs.writeFile(readmeOutputFilePath, readme, 'utf-8');
}

function generateFieldsDescription(compiledData: CompiledData): string {
	let result = "";
	for (const elementType of Object.keys(compiledData.schema)) {
		const element = compiledData.schema[elementType];
		const thisTypeSupplements = [...compiledData.typeSupplementing[elementType] ?? []];
		const thisTypeIsSupplementedBy = [...compiledData.typeSupplementedBy[elementType] ?? []];
		const thisTypeSupplementsStr = thisTypeSupplements.map(t => '\`' + t + '\`').join(', ');
		const thisTypeIsSupplementedByStr = thisTypeIsSupplementedBy.map(t => '\`' + t + '\`').join(', ');

		result += `
<details>
<summary><b>${element.name}</b></summary>

Addable: ${element.addable ? "Yes" : "No"}.

${((thisTypeSupplements.length > 0) || (thisTypeIsSupplementedBy.length > 0)) ? 'Connections by same ID:' : ''}
${(thisTypeIsSupplementedBy.length > 0) ? '- ' + thisTypeIsSupplementedByStr : ''}
${(thisTypeSupplements.length > 0) ? '- ' + thisTypeSupplementsStr : ''}

${element.comment ? element.comment + "\n" : ""}
| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |`;

for (const fieldName of Object.keys(element.fields)) {
	const desc = makeFieldDescription(element, fieldName, compiledData);
	result += `\n|${desc.name}|${desc.typeString}|${desc.comment}|${desc.values}|`
}

result += `
</details>
`
	}
	return result;
}

interface makeFieldDescriptionResult { name: string, typeString: string, comment: string, values: string };
function makeFieldDescription(element: Element, fieldName: string, compiledData: CompiledData): makeFieldDescriptionResult {
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
	return {
		name: fieldName,
		typeString: inputTypeString,
		comment: field.comment,
		values: valuesString,
	}
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
			console.error(`Unknown keyword group ${value}`);
			continue;
		}
		result.groups.push({
			groupName: alias,
			values: removeCaseDuplicates(Object.keys(kwgroup)).toSorted(),
		});
	}

	return result;
}

function getInputKeywordsRecursive(content: TypeDefinition): string[] {
	switch (content.type) {
		case TypeID.kw:
			return [ content.group ];
		case TypeID.list:
			return getInputKeywordsRecursive(content.element);
		case TypeID.sequence:
		case TypeID.union:
			return content.elements.map(x => getInputKeywordsRecursive(x)).flat();
		case TypeID.sub:
			return [ content.group ];
		default:
			return [];
	}
}

function removeCaseDuplicates(arr: string[]) {
	const seen = new Set();
	return arr.filter(str => {
		const key = str.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
