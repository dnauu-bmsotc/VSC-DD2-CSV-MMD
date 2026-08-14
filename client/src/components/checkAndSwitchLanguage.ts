import * as vscode from 'vscode';

export function checkAndSwitchLanguage(document: vscode.TextDocument) {
    const isCsv = document.languageId === 'csv';
    const isDd2Csv = document.languageId === 'DD2MMD';

    if ((isCsv || isDd2Csv) && document.lineCount > 0) {
        const config = vscode.workspace.getConfiguration('DD2CSVMMD');
        const method = config.get<string>('languageDetectionMethod');

        switch (method) {
            case "firstLine":
                const firstLine = document.lineAt(0).text;
                const isMatching = /^element_start.*/.test(firstLine);
                isMatching ? switchOn(document) : switchOff(document);
                break;
            case "allCsv":
                switchOn(document);
                break;
            default:
                switchOff(document);
                break;
        }
    }
}

function switchOn(document: any) {
    if (document.languageId !== 'DD2MMD') {
        vscode.languages.setTextDocumentLanguage(document, 'DD2MMD');
    }
}

function switchOff(document: any) {
    if (document.languageId !== 'csv') {
        vscode.languages.setTextDocumentLanguage(document, 'csv');
    }
}