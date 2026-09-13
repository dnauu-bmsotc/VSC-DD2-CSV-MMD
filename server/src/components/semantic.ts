import { DiagnosticSeverity, Range } from 'vscode-languageserver';
import { ASTElement, ASTField, ASTValue, DiagnosticType, MmdDiagnostic, parsePSV, TypeEvaluated,
	EvaluationType, GameType, ResourceScopeEligibleGameTypes, ResourceScope, gameTypeToVerbose, gameTypeList } from './parser';
import { FieldsDescription, TypeDefinition, TypeDefinitionBasic, TypeDefinitionID, TypeDefinitionKW,
	TypeDefinitionSequence, TypeDefinitionTagReceiver, TypeID, typeToVerbose, ValuesDescription } from './schema';
import { Emitter, ERType, getKeyFromElement, Index, KeyInfo} from '.';

interface ValidationContext {
	element: ASTElement;
	field: ASTField;
}

export class Semantic {
	constructor(
		private readonly schema: FieldsDescription,
		private readonly keywords: ValuesDescription,
		private readonly index: Index,
	) {}

	/**
	 * Pushes found diagnostics to element.diagnostics and tries to evaluate ASTValue.evaluatedType.
	 */
	public solveElement(element: ASTElement): void {
		// reset diagnostics and evaluated types.
		element.diagnostics = [];
		for (const f of element.fields) {
			for (const v of f.values) {
				v.evaluatedType = null;
			}
		}

		// find element in csv description
		const elementDefinition = this.schema[element.elementType];
		if (!elementDefinition) {
			element.diagnostics.push({
				diagnostic: {
					severity: DiagnosticSeverity.Error,
					range: element.range,
					message: `Unrecognized element type "${element.elementType}"`,
				},
				flags: DiagnosticType.ElementType,
			});
			return;
		}
		// KingdomMap elements are not processed.
		if (!elementDefinition.process) {
			return;
		}
		// Addables check
		if (!elementDefinition.addable) {
			const key = getKeyFromElement(element);
			const gameTypeAvailability = this.emitterGameTypeAvailability(element.scope, key);
			for (const gameType of ResourceScopeEligibleGameTypes[element.scope]) {
				const emitters = gameTypeAvailability[gameType];
				if (emitters.length >= 2) {
					element.diagnostics.push({
						diagnostic: {
							severity: DiagnosticSeverity.Error,
							range: element.range,
							message: `${element.elementType} is not addable. `
								+ `Found ${emitters.length} definitions in [${gameTypeToVerbose(gameType)}].`,
						},
						flags: DiagnosticType.NotAddable,
					});
				}
			}
		}
		// Process each field in the element.
		for (const field of element.fields) {
			if (!field.name) {
				continue;
			}
			const fieldDefinition = elementDefinition.fields[field.name];
			if (!fieldDefinition) {
				element.diagnostics.push({
					diagnostic: {
						severity: DiagnosticSeverity.Error,
						range: field.range,
						message: `Unrecognized field name "${field.name}"`,
					},
					flags: DiagnosticType.FieldName,
				});
				continue;
			}
			if (field.values.length === 0) {
				continue;
			}
			const context = { element, field };
			const fieldValidationResult = this.validateValues(field.values, fieldDefinition.input, context);
			if (fieldValidationResult) {
				element.diagnostics.push(fieldValidationResult);
			}
		}
	}

	/**
	 * Validates values against the provided definition.
	 * @values List of values to validate. These values might differ from c.field.values.
	 * @returns One diagnostic object for the first error encountered.
	 */
	private validateValues(values: ASTValue[], definition: TypeDefinition, c: ValidationContext): MmdDiagnostic | null {
		switch (definition.type) {
			case TypeID.any:
				return null;

			case TypeID.bool:
				return this.singleValueCheck(values, definition, this.isBoolString);

			case TypeID.int:
				return this.singleValueCheck(values, definition, this.isIntegerString);

			case TypeID.range:
				return this.singleValueCheck(values, definition, this.isRangeString);

			case TypeID.float:
				return this.singleValueCheck(values, definition, this.isNumericString);

			case TypeID.nothing:
				if (values.some(v => !!v.text)) {
					return this.createExpectedEndOfInputDiagnostic(values);
				}
				return null;

			case TypeID.id:
				const idKey: KeyInfo = { type: ERType.id, group: definition.group, name: values[0].text };
				const idGameTypeAvailabilityDiagnostic = this.validateEmitterGameTypeAvailability(values, definition, idKey, c);
				if (idGameTypeAvailabilityDiagnostic) {
					return idGameTypeAvailabilityDiagnostic;
				}
				values[0].evaluatedType = { evaluationType: EvaluationType.basic, definition: definition };
				if (values.length > 1) {
					return this.createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;

			case TypeID.tagReceiver:
				const tagKey: KeyInfo = { type: ERType.tag, group: definition.group, name: values[0].text };
				const tagGameTypeAvailabilityDiagnostic = this.validateEmitterGameTypeAvailability(values, definition, tagKey, c);
				if (tagGameTypeAvailabilityDiagnostic) {
					return tagGameTypeAvailabilityDiagnostic;
				}
				values[0].evaluatedType = { evaluationType: EvaluationType.basic, definition: definition };
				if (values.length > 1) {
					return this.createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;
				
			case TypeID.tagEmitter:
				values[0].evaluatedType = { evaluationType: EvaluationType.basic, definition: definition };
				if (values.length > 1) {
					return this.createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;

			case TypeID.kw:
				const kwgroup = this.keywords[definition.group];
				if (!kwgroup) {
					console.error(`Keyword group ${definition.group} is not found.`);
					return null;
				}
				if (!Object.hasOwn(kwgroup, values[0].text)) {
					return this.createUnresolvedReferenceDiagnostic(values[0], definition);
				}
				values[0].evaluatedType = { evaluationType: EvaluationType.basic, definition: definition };
				if (values.length > 1) {
					return this.createExpectedEndOfInputDiagnostic(values.slice(1));
				}
				return null;

			case TypeID.sequence:
				for (let i = 0; i < definition.elements.length; i++) {
					if (i >= values.length) {
						return this.createMissingSequenceValueDiagnostic(values, definition, c);
					}
					if (definition.elements[i].type === TypeID.list) {
						return this.validateValues(values.slice(i), definition.elements[i], c);
					}
					else {
						const diagnostic = this.validateValues([values[i]], definition.elements[i], c);
						if (diagnostic) {
							return diagnostic;
						}
					}
				}
				if (values.length > definition.elements.length) {
					return this.createExpectedEndOfInputDiagnostic(values.slice(definition.elements.length));
				}
				return null;
			
			case TypeID.list:
				if (definition.element.type === TypeID.sequence) {
					const listElementNumberOfValues = definition.element.elements.length;
					for (let i = 0; i < values.length; i += listElementNumberOfValues) {
						if (i + listElementNumberOfValues > values.length) {
							this.createMissingSequenceValueDiagnostic(values.slice(i), definition.element, c);
						}
						const valuesSlice = values.slice(i, i + listElementNumberOfValues);
						const diagnostic = this.validateValues(valuesSlice, definition.element, c);
						if (diagnostic) {
							return diagnostic;
						}
					}
				}
				else {
					for (const v of values) {
						if (!v.text.trim()) {
							continue;
						}
						const diagnostic = this.validateValues([v], definition.element, c);
						if (diagnostic) {
							return diagnostic;
						}
					}
				}
				return null;

			case TypeID.union:
				const matchedTypes: TypeEvaluated[][] = [];
				for (const optionType of definition.elements) {
					const diagnostic = this.validateValues(values, optionType, c);
					if (!diagnostic) {
						matchedTypes.push(values.map(v => v.evaluatedType));
					}
				}
				if (!matchedTypes.length) {
					return this.createUnresolvedUnionDiagnostic(values[0], definition);
				}
				if (matchedTypes.length > 1) {
					for (let i = 0; i < values.length; i++) {
						const typeOptions = matchedTypes.map(x => x[i]);
						values[i].evaluatedType = {
							evaluationType: EvaluationType.union,
							definitions: typeOptions,
						};
					}
				}
				return null;


			case TypeID.dependent:
			case TypeID.dependentRequired:
				const influencedFieldDefinition = definition;
				const influenceSourceField = c.element.fields.find(f => f.name === influencedFieldDefinition.field);
				if (!influenceSourceField) {
					return {
						diagnostic: {
							severity: DiagnosticSeverity.Error,
							range: c.field.range,
							message: `Missing required field ${influencedFieldDefinition.field}.`,
						},
						flags: DiagnosticType.FieldValue,
					};
				}
				const influenceSourceSchema = this.schema[c.element.elementType].fields[influenceSourceField.name].input;
				const influenceSourceSchemaContent = influenceSourceSchema.type === TypeID.list ? influenceSourceSchema.element : influenceSourceSchema;
				if (influenceSourceSchemaContent.type !== TypeID.kw) {
					console.error(`Influence field ${c.field.name} in element ${c.element.name} is not a KW or List(KW) field.`);
					return null;
				}
				if ((c.field.values.length) && (influenceSourceField.values.length === 0)) {
					return {
						diagnostic: {
							severity: DiagnosticSeverity.Error,
							range: c.field.range,
							message: `Field-influencer ${influenceSourceField.name} is empty.`,
						},
						flags: DiagnosticType.FieldValue,
					};
				}
				if ((influenceSourceSchema.type === TypeID.list)) {
					const requiredAndNotSatisfied = (definition.type === TypeID.dependentRequired) && (influenceSourceField.values.length != c.field.values.length);
					const dependentAndTooManyValues = (definition.type === TypeID.dependent) && (influenceSourceField.values.length < c.field.values.length);
					if (requiredAndNotSatisfied || dependentAndTooManyValues) {
						const message = `Field-influencer ${influenceSourceField.name} has a different number of` +
							`values (${influenceSourceField.values.length}) than this field (${c.field.values.length}).`;
						return {
							diagnostic: {
								severity: DiagnosticSeverity.Error,
								range: c.field.range,
								message: message,
							},
							flags: DiagnosticType.FieldValue,
						}
					};
				}
				const influenceKWGroup = this.keywords[influenceSourceSchemaContent.group];
				if (!influenceKWGroup) {
					console.error(`Unrecognized dependency group ${influenceSourceSchemaContent.group}`);
					return null;
				}
				for (let i = 0; i < influenceSourceField.values.length; i++) {
					if (i >= c.field.values.length) {
						return null;
					}
					const sourceValue = influenceSourceField.values[i];
					const influenceValueDesc = influenceKWGroup[sourceValue.text];
					const influenceType = influenceValueDesc?.influences?.[c.element.elementType + " " + c.field.name];
					if (!influenceValueDesc || !influenceType) {
						// field influencer has unrecognized values.
						// no diagnostic or error is fired because that unrecognized value
						// is managed by validating the influencing field, not this one.
						return null;
					}
					const valuesToValidate = influenceSourceSchema.type === TypeID.list ? c.field.values.slice(i, i + 1) : c.field.values;
					if ((definition.type === TypeID.dependentRequired) && (valuesToValidate.some(v => !v.text.trim()))) {
						return this.createExpectedTypeDiagnostic(influenceType.input, c.field.values[i].range);
					}
					const validationResult = this.validateValues(valuesToValidate, influenceType.input, c);
					if (validationResult) {
						return validationResult;
					}
				}
				return null;

			case TypeID.sub:
				const groupKWType: TypeDefinitionKW = { type: TypeID.kw, group: definition.group };
				if (values.length < 1) {
					return this.createExpectedTypeDiagnostic(groupKWType, c.field.range);
				}
				const groupValidateResult = this.validateValues([values[0]], groupKWType, c);
				if (groupValidateResult) {
					return groupValidateResult;
				}
				const KWGroup = this.keywords[definition.group];
				if (!KWGroup) {
					console.error(`Unrecognized subtype group ${definition.group}`);
					return null;
				}
				const valueDesc = KWGroup[values[0].text];
				if (!valueDesc) {
					console.error(`Subtype group ${definition.group} has no ${values[0].text}.`);
					return null;
				}
				const derivedType = valueDesc.influences?.[definition.subtypeString];
				if (!derivedType) {
					console.error(`Subtype ${definition.subtypeString} has empty fields.`);
					return null;
				}
				if (values.length < 2) {
					return this.createExpectedTypeDiagnostic(derivedType.input, values[0].range);
				}
				const subtypeValidateResult = this.validateValues([values[1]], derivedType.input, c);
				if (subtypeValidateResult) {
					return subtypeValidateResult;
				}
				return definition.subtypeValueType
					? this.validateValues([values[2]], definition.subtypeValueType, c)
					: null;

			case TypeID.psv:
				const psValues = parsePSV(values[0]);
				const psvValidation = this.validateValues(psValues, definition.element, c);
				values[0].evaluatedType = {
					evaluationType: EvaluationType.psv,
					values: psValues,
				};
				return psvValidation;
		}
	}

	/**
	 * Checks if the list of values has one value only.
	 * Modifies value's evaluatedType member.
	 */
	private singleValueCheck(values: ASTValue[], definition: TypeDefinitionBasic, checker: (v: string) => boolean): MmdDiagnostic | null {
		// values.length > 0 is asserted in this.solveElement function.
		if (!checker(values[0].text)) {
			return this.createExpectedTypeDiagnostic(definition, values[0].range);
		}
		values[0].evaluatedType = { evaluationType: EvaluationType.basic, definition: definition };;
		if (values.length > 1) {
			return this.createExpectedEndOfInputDiagnostic(values.slice(1));
		}
		return null;
	}

	private validateEmitterGameTypeAvailability(values: ASTValue[], definition: TypeDefinitionID | TypeDefinitionTagReceiver,
		key: KeyInfo, c: ValidationContext): MmdDiagnostic | null {
		const availability = this.emitterGameTypeAvailability(c.element.scope, key);
		const unavailability: GameType[] = [];
		for (const gameType of ResourceScopeEligibleGameTypes[c.element.scope]) {
			if (availability[gameType].length === 0) {
				unavailability.push(gameType);
			}
		}
		if (unavailability.length === gameTypeList.length) {
			return this.createUnresolvedReferenceDiagnostic(values[0], definition);
		}
		else if (unavailability.length > 0) {
			return {
				diagnostic: {
					severity: DiagnosticSeverity.Error,
					range: values[0].range,
					message: `Value not found for game types: ${unavailability.map(gameTypeToVerbose).join(', ')}.`,
				},
				flags: DiagnosticType.NotAddable,
			};
		}
		return null;
	}

	private emitterGameTypeAvailability(scope: ResourceScope, key: KeyInfo) {
		const result = {} as Record<GameType, Emitter[]>;
		const currentGameTypes = ResourceScopeEligibleGameTypes[scope];
		for (const gameType of currentGameTypes) {
			const availableEmitters = this.index.findEmitters(gameType, key);
			result[gameType] = availableEmitters;
		}
		return result;
	}

	private isBoolString = (str: string) => (str.toLowerCase() === "true") || (str.toLowerCase() === "false");

	private isNumericString = (str: string) => !isNaN(Number(str));

	private isIntegerStringRegex = /^-?\d+$/;
	private isIntegerString = (str: string) => this.isIntegerStringRegex.test(str);

	private isRangeStringRegex = /^\[\d+-\d+\]$/;
	private isRangeString = (str: string) => this.isRangeStringRegex.test(str);
	
	private createExpectedTypeDiagnostic(expectedType: TypeDefinition, range: Range): MmdDiagnostic {
		return {
			diagnostic: {
				severity: DiagnosticSeverity.Error,
				range: range,
				message: `Expected type:\n${typeToVerbose(expectedType)}`,
			},
			flags: DiagnosticType.FieldValue,
		};
	}

	private createExpectedEndOfInputDiagnostic(values: ASTValue[]): MmdDiagnostic {
		const range = Range.create(
			{ line: values[0].range.start.line, character: values[0].range.start.character },
			{ line: values[values.length - 1].range.end.line, character: values[values.length - 1].range.end.character },
		);
		return {
			diagnostic: {
				severity: DiagnosticSeverity.Error,
				range: range,
				message: `Expected end of input.`,
			},
			flags: DiagnosticType.FieldValue,
		};
	}

	private createUnresolvedReferenceDiagnostic(value: ASTValue, expectedType: TypeDefinition): MmdDiagnostic {
		return {
			diagnostic: {
				severity: DiagnosticSeverity.Error,
				range: value.range,
				message: `Unresolved reference "${value.text}".\nExpected value of type:\n${typeToVerbose(expectedType)}`,
			},
			flags: DiagnosticType.FieldValue,
		};
	}

	private createUnresolvedUnionDiagnostic(value: ASTValue, expectedType: TypeDefinition): MmdDiagnostic {
		return {
			diagnostic: {
				severity: DiagnosticSeverity.Error,
				range: value.range,
				message: `Unresolved value "${value.text}".\nExpected value of type:\n${typeToVerbose(expectedType)}`,
			},
			flags: DiagnosticType.FieldValue,
		};
	}

	private createMissingSequenceValueDiagnostic(values: ASTValue[], definition: TypeDefinitionSequence, c: ValidationContext): MmdDiagnostic {
		const missingValues = definition.elements.slice(values.length).map(etype => typeToVerbose(etype, ));
		return {
			diagnostic: {
				severity: DiagnosticSeverity.Error,
				range: c.field.range,
				message: `Field requires more values:\n${missingValues.join(", ")}.`,
			},
			flags: DiagnosticType.FieldValue
		};
	}
}
