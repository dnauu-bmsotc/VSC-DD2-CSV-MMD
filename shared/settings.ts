export interface DD2CSVMMDSettings {
	validateElementBoundaries: boolean;
	validateElementTypes: boolean;
	validateFieldNames: boolean;
	showEmptyFields: boolean;
	processProjectFolder: boolean;
	validateFieldInput: boolean;
	allowComments: boolean;
}

export interface DD2CSVMMDInitializationSettings {
	devMode: boolean;
	DD2ExcelDirs: string[];
	modDirs: string[];
}

export const defaultConfiguration: DD2CSVMMDSettings = Object.freeze({
	validateElementBoundaries: true,
	validateElementTypes: true,
	validateFieldNames: true,
	validateFieldInput: true,
	showEmptyFields: true,
	processProjectFolder: true,
	allowComments: false,
	dd2CsvDetectionMethod: "firstLine",
});