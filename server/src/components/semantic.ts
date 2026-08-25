import { Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, SemanticTokensParams } from 'vscode-languageserver';
import { ProjectManager } from './project';
import { TypeDefinition } from './schema';

const semanticTokenDict = { 'id': 0, 'tag': 1, 'keyword': 2 };
const semanticTokenTypes = [...Object.keys(semanticTokenDict)];

export const semanticTokensLegend: SemanticTokensLegend = {
	tokenTypes: semanticTokenTypes,
	tokenModifiers: [],
}

export class SemanticTokensProvider {
	constructor(
		private readonly project: ProjectManager,
		private readonly logSemanticTimeUse = false,
	) {}

	provide(uri: string): SemanticTokens {
		if (!this.project.configuration.useSemanticHighlighting) {
			return { data: [] };
		}
		try {
			const t0 = performance.now();
			const fileState = this.project.get(uri);
			if (!fileState) {
				return { data: [] };
			}
			const builder = new SemanticTokensBuilder();
			for (const element of fileState.ast) {
				for (const field of element.fields) {
					for (const value of field.values) {
						const computedType = value.computedType;
						if (computedType) {
							this.addTokenByType(builder, value.range, computedType);
						}
					}
				}
			}
			if (this.logSemanticTimeUse) {
				console.info(`Semantic colors: ${(performance.now() - t0).toFixed(1)} ms.`);
			}
			return builder.build();
		}
		catch (error) {
			return { data: [] };
		}
	}

	addTokenByType(builder: SemanticTokensBuilder, range: Range, definition: TypeDefinition) {
		switch (definition.type) {
			case "id":
				this.addToken(builder, range, semanticTokenDict.id);
				break;
			case "tagEmitter":
				this.addToken(builder, range, semanticTokenDict.tag);
				break;
			case "tagReceiver":
				this.addToken(builder, range, semanticTokenDict.tag);
				break;
			case "kw":
				this.addToken(builder, range, semanticTokenDict.keyword);
				break;
			case "union":
				this.addTokenByType(builder, range, definition.elements[0]);
				break;
		}
	}

	addToken(builder: SemanticTokensBuilder, range: Range, tokenType: number) {
		const length = range.end.character - range.start.character;
		builder.push(range.start.line, range.start.character, length, tokenType, 0);
	}
}