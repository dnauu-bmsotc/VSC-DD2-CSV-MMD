export interface DD2CSVMMDSettings {
	externalDirectories: string[];
	features: {
		autocomplete: boolean;
		semanticHighlighting: boolean;
		hintsOnHover: boolean;
		validationComments: boolean;
		validationElementBoundary: boolean;
		validationElementType: boolean;
		validationFieldName: boolean;
		validationFieldValues: boolean;
		validationAddables: boolean;
		validationWhitespace: boolean;
	},
}

export interface InitializationSettings {
	configuration: DD2CSVMMDSettings,
	globalStoragePath: string,
}
