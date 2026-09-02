import { Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { TypeDefinition, TypeID } from './schema';
import { UriString } from '../../../shared/utils';
import { ASTValue, EvaluationType, TypeEvaluated } from './parser';

const semanticTokenDict = { 'id': 0, 'tag': 1, 'keyword': 2 };
const semanticTokenTypes = [...Object.keys(semanticTokenDict)];

export const semanticTokensLegend: SemanticTokensLegend = {
	tokenTypes: semanticTokenTypes,
	tokenModifiers: [],
}

export class SemanticTokensProvider {
	constructor(
		private readonly project: ProjectManager,
	) {}

	public provide(uri: UriString): SemanticTokens {
		if (!this.project.getConfiguration().features.semanticHighlighting) {
			return { data: [] };
		}
		try {
			const t0 = performance.now();
			const fileState = this.project.getFileState(uri);
			if (!fileState) {
				return { data: [] };
			}
			const builder = new SemanticTokensBuilder();
			for (const element of fileState.ast) {
				for (const field of element.fields) {
					this.provideForValues(builder, field.values);
				}
			}
			console.info(`Semantic tokens [${(performance.now() - t0).toFixed(1)} ms].`);
			return builder.build();
		}
		catch (error) {
			return { data: [] };
		}
	}

	
	private provideForValues(builder: SemanticTokensBuilder, values: ASTValue[]): void {
		for(const value of values) {
			if (!value.evaluatedType) {
				continue;
			}
			if (value.evaluatedType.evaluationType === EvaluationType.psv) {
				this.provideForValues(builder, value.evaluatedType.values);
			}
			else {
				const definition = this.getDefinitionFromEvaluated(value.evaluatedType);
				this.addTokenByType(builder, value.range, definition);
			}
		}
	}

	private getDefinitionFromEvaluated(type: TypeEvaluated): TypeDefinition {
		if (!type) {
			return { type: TypeID.any };
		}
		switch (type.evaluationType) {
			case EvaluationType.basic:
				return type.definition;
		
			case EvaluationType.union:
				if (type.definitions.length === 0) {
					return { type: TypeID.any };
				}
				return this.getDefinitionFromEvaluated(type.definitions[0]);

			// psv values are omitted during provideForValues step.
			case EvaluationType.psv:
				return { type: TypeID.any };
		}
	}

	private addTokenByType(builder: SemanticTokensBuilder, range: Range, definition: TypeDefinition) {
		switch (definition.type) {
			case TypeID.id:
				this.addToken(builder, range, semanticTokenDict.id);
				break;
			case TypeID.tagEmitter:
				this.addToken(builder, range, semanticTokenDict.tag);
				break;
			case TypeID.tagReceiver:
				this.addToken(builder, range, semanticTokenDict.tag);
				break;
			case TypeID.kw:
				this.addToken(builder, range, semanticTokenDict.keyword);
				break;
			case TypeID.union:
				this.addTokenByType(builder, range, definition.elements[0]);
				break;
		}
	}

	addToken(builder: SemanticTokensBuilder, range: Range, tokenType: number) {
		const length = range.end.character - range.start.character;
		builder.push(range.start.line, range.start.character, length, tokenType, 0);
	}
}