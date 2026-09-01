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
	FileChangeType,
	SemanticTokensParams,
	Diagnostic,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { URI } from 'vscode-uri';

import { DD2CSVMMDSettings } from '../../shared/settings';
import { ProjectManager } from './components/project';
import { semanticTokensLegend, SemanticTokensProvider } from './components/highlight';
import { makeUriString, UriString } from '../../shared/utils';
import { assembleReadme } from './components/readme';
import { compileData } from './components/schema';

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
// let hover: HoverManager;
let semanticTokensProvider: SemanticTokensProvider;

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
	if (!workspaceUri) {
		throw new Error("Workspace required");
	}
	const workspace = URI.parse(workspaceUri);
	
	const compiledData = await compileData();
	assembleReadme(compiledData);
	project = new ProjectManager(compiledData);
	project.initialize(workspace);
	// hover = new HoverManager(project);
	semanticTokensProvider = new SemanticTokensProvider(project);
	
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
	// await publishDiagnosticsDebounced(null, "Initialization");
});

connection.onDidChangeConfiguration(async () => {
	// const configuration: DD2CSVMMDSettings = await connection.workspace.getConfiguration("DD2CSVMMD");
	// project.setConfiguration(configuration);
	// await publishDiagnosticsDebounced(null, "Configuration change");
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
	// await publishDiagnosticsDebounced(null, "File/directory change");
});

documents.onDidOpen(e => {
	project.openDocument(makeUriString(e.document.uri));
});

documents.onDidClose(e => {
	project.closeDocument(makeUriString(e.document.uri));
});

documents.onDidChangeContent(async (e) => {
	const affected = project.updateDocument(makeUriString(e.document.uri), e.document.getText());
	publishDiagnostics();
});

function publishDiagnostics() {
	const t0 = performance.now();
	for (const fileState of project.getAllFileStates()) {
		const diagnostics: Diagnostic[] = [];
		for (const d of fileState.parseDiagnostics) {
			diagnostics.push(d.diagnostic);
		}
		for (const e of fileState.ast) {
			for (const d of e.diagnostics ?? []) {
				diagnostics.push(d.diagnostic);
			}
		}
		connection.sendDiagnostics({
			uri: fileState.uri,
			diagnostics: diagnostics,
		});
	}
	const duration = (performance.now() - t0).toFixed(1);
	console.info(`Publishing diagnostics [${duration} ms].`);
}

connection.onHover(params => {
	// hover.onHover(params)
});

connection.languages.semanticTokens.on(
	async function onSemanticTokens(params: SemanticTokensParams) {
		return semanticTokensProvider.provide(makeUriString(params.textDocument.uri));
	}
);

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
