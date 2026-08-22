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

import { updateTokenColors } from './components/updateTokenColors';
import { DD2CSVMMDInitializationSettings } from '../../shared/settings';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	updateTokenColors(context);
	context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('DD2CSVMMD.tokenColors')) {
                updateTokenColors(context);
            }
        })
    );

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server', 'src', 'server.js')
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

	const config = vscode.workspace.getConfiguration("DD2CSVMMD");
	const initializationOptions: DD2CSVMMDInitializationSettings = {
		devMode: config.get("devMode", false),
		DD2ExcelDirs: config.get("DD2ExcelDirs", []),
		modDirs: config.get("modDirs", []),
	}

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'DD2MMD' }],
		synchronize: {
			fileEvents: [
				workspace.createFileSystemWatcher('**/*.Group.csv'),
				workspace.createFileSystemWatcher('**/.clientrc')
			]
		},
		initializationOptions: initializationOptions,
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'DD2CSVMMDLS',
		'DD2 CSV Language Server MMD',
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
