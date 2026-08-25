import * as fs from 'fs';
import * as vscode from 'vscode';

export async function updateTokenColors(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration();
    const configColorSetting = config.get<string>('DD2CSVMMD.tokenColors');

	switch (configColorSetting) {
		case "phombie":
		case "mmd":
			const fileUri = vscode.Uri.joinPath(context.extensionUri, 'syntaxes', 'DD2MMDTokenCustomization.json');
			const fileData = fs.readFileSync(fileUri.fsPath, 'utf8');
			const customColors = JSON.parse(fileData);
			let selectedColors;
			switch (configColorSetting) {
				case "phombie":
					selectedColors = customColors.PHombie;
					break;
				case "mmd":
					selectedColors = customColors.MMD;
					break;
			}
			await config.update(
				'editor.tokenColorCustomizations', 
				selectedColors, 
				vscode.ConfigurationTarget.Global
			);
			await config.update(
				'editor.semanticTokenColorCustomizations',
				{ "rules": selectedColors.semanticRules },
				vscode.ConfigurationTarget.Global
			);
			break;
		case "none":
		default:
			await config.update(
            	'editor.tokenColorCustomizations', 
				undefined, 
				vscode.ConfigurationTarget.Global
			);
			await config.update(
				'editor.semanticTokenColorCustomizations',
				{ "rules": undefined },
				vscode.ConfigurationTarget.Global
			);
			break;
	}
}