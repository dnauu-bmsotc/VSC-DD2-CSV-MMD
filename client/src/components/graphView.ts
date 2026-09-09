import { readFile } from 'fs/promises';
import * as vscode from 'vscode';
import { graphViewPage } from '../../../shared/projectPaths';
import { LanguageClient } from 'vscode-languageclient/node';
import { GraphViewDataAnswer, GraphViewDataRequest } from '../../../shared/settings';

export function createGraphViewDisposable(client: LanguageClient) {
	return vscode.commands.registerCommand('DD2CSVMMD.graphView', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const position = editor.selection.active;
		const documentUri = editor.document.uri.toString();

		try {
			const requestOptions: GraphViewDataRequest = {
				uri: documentUri,
				line: position.line,
			};
			const serverData = await client.sendRequest('custom/fetchGraphViewData', requestOptions) as GraphViewDataAnswer;
			if (!serverData) {
				return;
			}
			const panelOptions = {
				enableScripts: true,
			};
			const panel = vscode.window.createWebviewPanel(
				'dd2csvmmd', 
				'DD2 CSV Graph', 
				vscode.ViewColumn.Beside,
				panelOptions,
			);
			let pageText = await readFile(graphViewPage, 'utf8');
			pageText = pageText.replace("const nodes = []", "const nodes = " + JSON.stringify(serverData.nodes));
			pageText = pageText.replace("const edges = []", "const edges = " + JSON.stringify(serverData.edges));
			panel.webview.html = pageText;
			console.log(pageText);
		}
		catch (error) {
			vscode.window.showErrorMessage(`Failed to fetch LSP data: ${error}`);
		}
	});
}