import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	DidChangeWatchedFilesNotification,
	FileChangeType,
	SemanticTokensParams,
	SemanticTokensRefreshRequest,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { URI } from 'vscode-uri';

import { DD2CSVMMDSettings, InitializationSettings } from '../../shared/settings';
import { ProjectManager } from './components/project';
import { semanticTokensLegend, SemanticTokensProvider } from './components/highlight';
import { makeUriString, UriString } from '../../shared/utils';
import { assembleReadme } from './components/readme';
import { compileData } from './components/schema';
import { DiagnosticsPublisher } from './components/diagnostics';
import { HoverManager } from './components/hover';
import { CompletionProvider } from './components/autocomplete';

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
let diagnosticsPublisher: DiagnosticsPublisher;
let hover: HoverManager;
let semanticTokensProvider: SemanticTokensProvider;
let autocomplete: CompletionProvider;

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
	const capabilities = params.capabilities;

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
			hoverProvider: true,
			completionProvider: {
				resolveProvider: true,
			},
			semanticTokensProvider: {
				legend: semanticTokensLegend,
				full: true,
				range: false,
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
	let workspace = null;
	if (workspaceUri) {
		workspace = URI.parse(workspaceUri);
	}
	
	const initializationSettings: InitializationSettings = params.initializationOptions;
	const compiledData = compileData(initializationSettings.globalStoragePath);
	assembleReadme(compiledData);
	project = new ProjectManager(compiledData, initializationSettings.configuration);
	await project.initialize(workspace);
	hover = new HoverManager(project);
	diagnosticsPublisher = new DiagnosticsPublisher();
	semanticTokensProvider = new SemanticTokensProvider(project);
	autocomplete = new CompletionProvider(project);
	
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
});

connection.onDidChangeConfiguration(async () => {
	const configuration: DD2CSVMMDSettings = await connection.workspace.getConfiguration("DD2CSVMMD");
	project.setConfiguration(configuration);
	await publishDiagnostics();
	await connection.sendRequest(SemanticTokensRefreshRequest.type);
});

connection.onDidChangeWatchedFiles(async event => {
	const urisToUpdate = new Set<UriString>();
	const urisToRemove = new Set<UriString>();
	for (const change of event.changes) {
		const uri = makeUriString(change.uri);
		switch (change.type) {
			case FileChangeType.Created:
			case FileChangeType.Changed:
				urisToUpdate.add(uri);
				break;
			case FileChangeType.Deleted:
				urisToRemove.add(uri);
				break;
		}
	}
	for (const uri of urisToUpdate) {
		await project.updateFromDisk(uri);
	}
	for (const uri of urisToRemove) {
		await project.remove(uri);
	}
	await publishDiagnostics();
});

documents.onDidOpen(e => {
	project.openDocument(makeUriString(e.document.uri));
});

documents.onDidClose(e => {
	project.closeDocument(makeUriString(e.document.uri));
});

documents.onDidChangeContent(async (e) => {
	project.updateDocument(makeUriString(e.document.uri), e.document.getText());
	await publishDiagnostics();
});

async function publishDiagnostics() {
	await diagnosticsPublisher.publishDiagnostics([...project.getAllFileStates()], connection.sendDiagnostics, project.getConfiguration());
}

connection.onHover((params) => {
	return hover.onHover(params);
});

connection.languages.semanticTokens.on(
	async function onSemanticTokens(params: SemanticTokensParams) {
		return semanticTokensProvider.provide(makeUriString(params.textDocument.uri));
	}
);

// This handler provides the initial list of the completion items.
connection.onCompletion(params => {
	return autocomplete.getOnCompletion(params);
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(params => {
	return autocomplete.onCompletionResolve(params);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
