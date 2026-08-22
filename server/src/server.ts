import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DidChangeWatchedFilesNotification,
	FileChangeType
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as fs from 'node:fs/promises'; 

import { validateAstBySchema } from './components/validator';
import { ProjectManager } from './components/project';
import { URI } from 'vscode-uri';
import { DD2CSVMMDSettings } from '../../shared/settings';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let hasWatchedFilesCapability = false;

let project: ProjectManager;

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	hasWatchedFilesCapability = !!(
		capabilities.workspace && 
		capabilities.workspace.didChangeWatchedFiles && 
		capabilities.workspace.didChangeWatchedFiles.dynamicRegistration
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	const workspaceUri = params.workspaceFolders?.[0].uri;
	if (!workspaceUri) {
		throw new Error("Workspace required");
	}
	const workspace = URI.parse(workspaceUri);
	
	try {
		project = await ProjectManager.create(workspace, params.initializationOptions);
		await project.initialize();
	}
	catch(error) {
		const message = error instanceof Error ? error.message : String(error);
		connection.console.error(message);
		connection.window.showErrorMessage(message);
		throw Error;
	}
	
	return result;
});

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
	if (hasWatchedFilesCapability) {
		await connection.client.register(DidChangeWatchedFilesNotification.type, {
			watchers: [{ globPattern: "**/*.Group.csv" }],
		});
	}
	await publishDiagnostics(null, "Initialization");
});

connection.onDidChangeConfiguration(async () => {
	const configuration: DD2CSVMMDSettings = await connection.workspace.getConfiguration("DD2CSVMMD");
	project.setConfiguration(configuration);
	await publishDiagnostics(null, "Configuration change");
});

connection.onDidChangeWatchedFiles(async event => {
	console.log(event.changes)
	for (const change of event.changes) {
		switch (change.type) {
			case FileChangeType.Created:
				console.log(`A .Group.csv file was created: ${change.uri}`);
				await project.updateFromDisk(change.uri);
				await publishDiagnostics(null, "File creation");
				break;
			case FileChangeType.Changed:
				await project.updateFromDisk(change.uri);
				break;
			case FileChangeType.Deleted:
				console.log(`A .Group.csv file was deleted: ${change.uri}`);
				project.remove(change.uri);
				await publishDiagnostics(null, "File deletion");
				break;
		}
	}
});

documents.onDidOpen(e => {
	project.updateFileState(e.document.uri, e.document.getText());
});

// Only keep settings for open documents
documents.onDidClose(e => {
	
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (e) => {
	project.updateFileState(e.document.uri, e.document.getText());
	await publishDiagnostics(e.document.uri, "Content change");
});

async function publishDiagnostics(uri: string | null, reason: string) {
	const t0 = performance.now();
	const validateAll = project.configuration.validateProjectFiles || !uri;
	const files = validateAll ? [...project.files.keys()] : [uri];
	await Promise.all(files.map(async (uri) => {
		const text = project.get(uri)?.text;
		if (!text) {
			return;
		}
		const diagnostics = await validateTextDocument(uri, text);
		connection.sendDiagnostics({ uri, diagnostics, });
	}));
	console.info(`Validation of ${files.length} files: ${(performance.now() - t0).toFixed(1)} ms. Reason: ${reason}.`);
}

async function validateTextDocument(uri: string, text: string) {
	try {
		const fileState = project.updateFileState(uri, text);
		if (!fileState) {
			return [];
		}
		
		const fileStates = project.configuration.indexProjectFiles ? [...project.files.values()] : [fileState];
		const validationResult = validateAstBySchema(fileState.ast, project.compiledData, fileStates, project.configuration);

		return [...fileState.parseDiagnostics, ...validationResult];
	}
	catch (error) {
		console.error(error);
		return [];
	}
}

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
