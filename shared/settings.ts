export interface DD2CSVMMDSettings {
	validateElementBoundaries: boolean;
	validateElementTypes: boolean;
	validateFieldNames: boolean;
	showEmptyFields: boolean;
	validateProjectFiles: boolean;
	indexProjectFiles: boolean;
	validateFieldInput: boolean;
	allowComments: boolean;
}

export interface DD2CSVMMDInitializationSettings {
	devMode: boolean;
	DD2ExcelDirs: string[];
}

export const defaultConfiguration: DD2CSVMMDSettings = Object.freeze({
	validateElementBoundaries: true,
	validateElementTypes: true,
	validateFieldNames: true,
	validateFieldInput: true,
	showEmptyFields: true,
	validateProjectFiles: true,
	indexProjectFiles: true,
	allowComments: false,
	dd2CsvDetectionMethod: "firstLine",
});