import * as path from 'path';

const workspaceRoot = path.resolve(__dirname, '../../../');

export const fieldsDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Fields.ods');
export const valuesDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Values.ods');
export const elementsDescriptionPath = path.join(workspaceRoot, 'CSV description', 'CSV Elements.ods');

export const readmeBaseFilePath = path.resolve(workspaceRoot, 'readmeBase.md');
export const readmeOutputFilePath = path.resolve(workspaceRoot, 'README.md');

export const graphViewPage = path.resolve(workspaceRoot, 'client/src/components/graphView.html');
