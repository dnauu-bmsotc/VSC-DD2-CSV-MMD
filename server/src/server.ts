
/*
Description of CSV data is stored in `./CSV Description` directory in LibreOffice Calc files.
- `CSV Elements.ods` stores the list of element types and some comments.
- `CSV Fields.ods` has multiple sheets, each sheet corresponds to one element type. A sheet in this file contains field names, their input description in the format described above, and a comment.
- `CSV Values.ods` stores keywords and dependency information. It has multiple sheets, one sheet corresponds to one keyword group. The first column contains all possible values, other columns store information about how a specific keyword affects other fields.
	- For example, `CSV Fields.ods` describes *m_ConditionType*'s input in a *Condition* element as *ConditionType KW*. The extension takes the word before "KW" (that is *ConditionType*) and searches the sheet with the same name in `CSV Values.ods`. If this sheet does not have the provided value, the extension marks this value as an error.
	- Then, `CSV Fields.ods` describes *m_ConditionString* as `Dep(m_ConditionType)` which means that its input depends on the value of the *m_ConditionType* field in the same element. The extension searches `CSV Values.ods` for the "m_ConditionType" sheet and then searches for the column named [element type + field name], in this example it's "Condition m_ConditionString". This column describes what input should this field have depending on the value of another column.
	- Similar case are substat fields. For example, *ActorDataStats*' *sub_stat* field. It's input is described as `Sub(ActorStatSubType KW,Substat,float)`. The extension searches the "ActorStatSubType" sheet in `CSV Values.ods` and then searches for the "Substat" column that has the required input description.

*/

/*
On startup:
1. The extension reads contents of the VSCode project and Excel directories from the Darkest Dungeon II installation folder.
   Excel directories can be configured in extension's settings.
2. Each file is parsed into a list of elements, fields, values by commas. The "+" separator is not processed yet.
   After this step the extension has a list of files and what elements are stored in each file.
   Exact positions of fields and values in text are also stored.
3. Then each element is analyzed for IDs and tags.
   A separate storage is created for tag/id symbols and their references and what elements they belong to.
   It allows to track connections between elements.
4. With IDs and tags indexed, validation of elements becomes possible.
   During this step diagnostics are created and value types are clarified (`Dep`, `List` and other types are converted to more primitive types).
   Certain types cannot be reduced to primitive values, for example:
	- Unions: `m_TokenGlossaryHeroTag` field, despite its name, accepts hero tags or hero IDs. If provided value matches to both tag and ID, union cannot be reduced.
	- Plus-separated values: one value string contains multiple values.
   These values are stored along with primitive values. Hover hint and semantic token managers resolve them on their own.

On text change:
1. Old and new texts are compared, all elements in the changed region are reparsed and the old element data is replaced.
2. Before replacing old elements, the extension tracks what ID and tag definitions they have, and what other elements depend on these definitions so they can be revalidated.
3. New elements are indexed, and their connections to existing elements are tracked so affected elements can be revalidated.
*/


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
	const initializationSettings: InitializationSettings = params.initializationOptions;
	project = new ProjectManager(compiledData, initializationSettings.configuration);
	await project.initialize(workspace);
	hover = new HoverManager(project);
	diagnosticsPublisher = new DiagnosticsPublisher();
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
