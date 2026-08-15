/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import { checkAndSwitchLanguage } from './components/checkAndSwitchLanguage';
import { updateTokenColors } from './components/updateTokenColors';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    vscode.workspace.textDocuments.forEach(checkAndSwitchLanguage);
	updateTokenColors(context);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(checkAndSwitchLanguage)
    );
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
			checkAndSwitchLanguage(event.document);
        })
    );
	context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('DD2CSVMMD.languageDetectionMethod')) {
                vscode.workspace.textDocuments.forEach(checkAndSwitchLanguage);
            }
			if (event.affectsConfiguration('DD2CSVMMD.tokenColors')) {
                updateTokenColors(context);
            }
        })
    );

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'DD2MMD' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
