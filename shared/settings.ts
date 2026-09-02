export interface DD2CSVMMDSettings {
	// validateProjectFiles: boolean;
	// indexProjectFiles: boolean;
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
		validationFieldEmpty: boolean;
	},
}

export interface InitializationSettings {
	configuration: DD2CSVMMDSettings,
}
