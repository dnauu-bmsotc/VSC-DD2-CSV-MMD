export interface DD2CSVMMDSettings {
	validateElementBoundaries: boolean;
	validateElementTypes: boolean;
	validateFieldNames: boolean;
	showEmptyFields: boolean;
	processProjectFolder: boolean;
	validateFieldInput: boolean;
}

export interface DD2CSVMMDInitializationSettings {
	devMode: boolean;
	DD2ExcelDirs: string[];
	modDirs: string[];
}