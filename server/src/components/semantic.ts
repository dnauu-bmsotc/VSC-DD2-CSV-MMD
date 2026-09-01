import { Diagnostic, Range } from 'vscode-languageserver';
import { ValuesDescription } from './compiler';
import { ASTElement, ASTField, ASTValue } from './parser';
import { FieldsDescription, TypeDefinition, TypeID, TypeDefinitionDependent, TypeDefinitionDependentRequired } from './schema';
import { Index } from '.';

export class Semantic {
	constructor(
		private readonly schema: FieldsDescription,
		private readonly keywords: ValuesDescription,
	) {}

	public solveElement(element: ASTElement) {
		const diagnostics: Diagnostic[] = [];
		const elementDefinition = this.schema[element.elementType];
		if (!elementDefinition) {
			return { diagnostics };
		}
	}
}













// interface SolveFileContext {
// 	schema: FieldsDescription;
// 	index: Index | null;
// }

// interface SolveValueContext {
// 	element: ASTElement;
// 	field: ASTField;
// }

// type SolveContext = SolveFileContext & SolveValueContext;

// export function solveAst(ast: ASTElement[], c: SolveFileContext): ASTElementSolved[] {
// 	const result: ASTElementSolved[] = [];
// 	for (const element of ast) {
// 		const fields: ASTFieldSolved[] = [];
// 		for (const field of element.fields) {
// 			const inputDefinition = c.schema[element.elementType]?.fields[field.name]?.input;
// 			const context: SolveContext = { ...c, element, field };
// 			if (inputDefinition) {
// 				const values = solveValues(field.values, inputDefinition, context);
// 				fields.push({ ...field, values });
// 			}
// 		}
// 		result.push({ ...element, fields, });
// 	}
// 	return result;
// }

// function solveValues(values: ASTValue[], definition: TypeDefinition, c: SolveContext): { solved: boolean; values: ASTValueSolved[] } {
// 	switch (definition.type) {
// 		case TypeID.any:
// 			return {
// 				solved: true,
// 				values: values.map(v => ({ ...v, solvedType: { type: TypeID.any } })),
// 			};

// 		case TypeID.nothing:
// 		case TypeID.bool:
// 		case TypeID.int:
// 		case TypeID.float:
// 		case TypeID.range:
// 			if (values.length === 0) {
// 				return {
// 					solved: false,
// 					values: [{
// 						text: "",
// 						range: lineRangeEnd(c.field.range),
// 						solvedType: definition,
// 					}],
// 				};
// 			}
// 			const firstValue: ASTValueSolved = { ...values[0], solvedType: definition };
// 			const restValues: ASTValueSolved[] = values.slice(1).map(v => ({ ...v, solvedType: { type: TypeID.nothing } }));
// 			return [firstValue, ...restValues];

// 		case TypeID.id:
// 		case TypeID.kw:
// 		case TypeID.tagEmitter:
// 		case TypeID.tagReceiver:

// 		case TypeID.union:
// 			if (!c.index) {
// 				return values.map(v => ({ ...v, solvedType: { type: TypeID.any } }));
// 			}
// 			for (const typeOption of definition.elements) {
				
// 			}



// 				const matchedTypes = [];
// 				for (const optionType of definition.elements) {
// 					const diagnostic = validateInput(values, optionType, c);
// 					if (!diagnostic) {
// 						matchedTypes.push(optionType);
// 					}
// 				}
// 				if (!matchedTypes.length) {
// 					return createMissingGroupMemberDiagnostic(values[0], definition);
// 				}
// 				// for (const v of values) {
// 				// 	if (matchedTypes.length === 1) {
// 				// 		v.computedType = matchedTypes[0];
// 				// 	}
// 				// 	else {
// 				// 		v.computedType = { type: "union", elements: matchedTypes };
// 				// 	}
// 				// }
// 				return null;
// 			break;

// 		case TypeID.list:
// 			if (definition.element.type === TypeID.sequence) {
// 				const sequenceLength = definition.element.elements.length;
// 				for (let i = 0; i < values.length; i += sequenceLength) {
// 					solveValues(values.slice(i, i + sequenceLength), definition.element, c);
// 				}
// 			}
// 			else {
// 				for (const v of values) {
// 					solveValues([v], definition.element, c);
// 				}
// 			}
// 			break;
// 		case TypeID.sequence:
// 			for (let i = 0; i < definition.elements.length; i++) {
// 				solveValues(values.slice(i, i + 1), definition.elements[i], c);
// 			}
// 			break;

// 		case TypeID.dependent:
// 		case TypeID.dependentRequired:
// 			const influencedTypes = getDependencyInfluencedTypeSilent(definition, c);
// 			if (!influencedTypes) {
// 				break;
// 			}
// 			for (let i = 0; i < influencedTypes.types.length; i++) {
// 				const influencedType = influencedTypes.types[i];
// 				if (!influencedType) {
// 					continue;
// 				}
// 				const influencedValues = influencedTypes.isDependentOnList ? c.field.values.slice(i, i + 1) : c.field.values;
// 				solveValues(influencedValues, influencedType, c);
// 			}
// 			break;

// 		case TypeID.sub:
// 			break;

// 		case TypeID.psv:
// 			let idx = 0;
// 			const newVals: ASTValue[] = [];
// 			for (const v of values[0].text.split("+")) {
// 				if (v === "") {
// 					continue;
// 				}
// 				const line = values[0].range.start.line;
// 				const charStart = values[0].range.start.character;
// 				const range: Range = {
// 					start: { line, character: charStart + idx },
// 					end: { line, character: charStart + idx + v.length },
// 				};
// 				newVals.push({
// 					text: v,
// 					range: range,
// 				});
// 				idx += v.length + 1;
// 			}
// 			const idxToReplace = c.field.values.indexOf(values[0]);
// 			c.field.values.splice(idxToReplace, 1, ...newVals);
// 			solveValues(c.field.values.slice(idxToReplace, newVals.length), definition.element, c);
// 			break;
// 	}
// }

// function lineRangeEnd(range: Range): Range {
// 	return {
// 		start: { line: range.start.line, character: range.end.character - 1 },
// 		end: { line: range.start.line, character: range.end.character },
// 	}
// }


// /**
//  * Tries to get a list of types that dependent field can/needs to provide.
//  * If the field-influencer has multiple values, tries to get a list of types of the same length.
//  */
// export function getDependencyInfluencedTypeSilent(
// 	element: ASTElement,
// 	field: ASTField,
// 	definition: TypeDefinitionDependent | TypeDefinitionDependentRequired,
// 	schema: FieldsDescription,
// 	keywords: ValuesDescription,
// ): {
// 	types: (TypeDefinition | null)[],
// 	isDependentOnList: boolean;
// 	influenceSourceField: ASTField,
// } | null {
// 	const influenceSourceField = element.fields.find(f => f.name === definition.field);
// 	if (!influenceSourceField) {
// 		return null;
// 	}
// 	const influenceSourceSchema = schema[element.elementType].fields[influenceSourceField.name].input;
// 	const influenceSourceSchemaContent = influenceSourceSchema.type === "list" ? influenceSourceSchema.element : influenceSourceSchema;
// 	if (influenceSourceSchemaContent.type !== "kw") {
// 		return null;
// 	}
// 	const influenceKWGroup = keywords[influenceSourceSchemaContent.group];
// 	const influencedTypes = influenceSourceField.values.map(v => {
// 		const influenceValueDesc = influenceKWGroup[v.text];
// 		if (influenceValueDesc?.influences) {
// 			const influenceType = influenceValueDesc.influences?.[element.elementType + " " + field.name];
// 			if (influenceType) {
// 				return influenceType.input;
// 			}
// 		}
// 		return null;
// 	});

// 	return {
// 		types: influencedTypes,
// 		isDependentOnList: influenceSourceSchema.type === "list",
// 		influenceSourceField: influenceSourceField,
// 	};
// }
