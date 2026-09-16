import * as path from 'path';

const workspaceRoot = path.resolve(__dirname, '../../../');

export const fieldsDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Fields.fods');
export const valuesDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Values.fods');
export const elementsDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Elements.fods');

export const readmeBaseFilePath = path.resolve(workspaceRoot, 'readmeBase.md');
export const readmeOutputFilePath = path.resolve(workspaceRoot, 'README.md');

export const compiledDataGSRelative = 'compiledData.json';