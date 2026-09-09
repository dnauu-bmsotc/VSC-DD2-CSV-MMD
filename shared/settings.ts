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
		validationFieldEmpty: boolean;
		validationAddables: boolean;
		validationWhitespace: boolean;
	},
}

export interface InitializationSettings {
	configuration: DD2CSVMMDSettings,
}

export interface GraphViewDataRequest {
	uri: string;
	line: number;
}

export type GraphViewDataAnswer = GraphData | null;

export interface GraphData {
    nodes: GraphDataNode[];
    edges: GraphDataEdge[];
}

export interface GraphDataNode {
	id: number;
	label: string;
	color: string;
	[key: string]: any;
}

export interface GraphDataEdge {
	from: number;
	to: number;
	[key: string]: any;
}
