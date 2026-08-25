import { URI } from 'vscode-uri'
import * as path from 'node:path';
import * as fs from "node:fs"

import { Index } from '.';
import { AST, parseIntoAST } from './parser';
import { CompiledData, getCompiledData } from './compiler';
import { DD2CSVMMDInitializationSettings, DD2CSVMMDSettings, defaultConfiguration } from '../../../shared/settings';
import { assembleReadme } from './readme';
import { Diagnostic } from 'vscode-languageserver';

export interface FileState {
	uri: string;
	ast: AST;
	text: string;
	parseDiagnostics: Diagnostic[];
}

export class ProjectManager {
	readonly files = new Map<string, FileState>();
	readonly openDocuments = new Set<string>();
	readonly compiledData: CompiledData;
	readonly initializationOptions: DD2CSVMMDInitializationSettings;
	readonly workspaceRoot: URI;
	readonly index: Index;
	configuration: DD2CSVMMDSettings;

	private constructor(workspaceRoot: URI, compiledData: CompiledData, initializationOptions: DD2CSVMMDInitializationSettings) {
		this.compiledData = compiledData;
		this.workspaceRoot = workspaceRoot;
		this.initializationOptions = initializationOptions;
		this.configuration = defaultConfiguration;
		this.index = new Index(this.compiledData.schema, this.compiledData.keywords);
	}

	public static async create(workspaceRoot: URI, initializationOptions: DD2CSVMMDInitializationSettings): Promise<ProjectManager> {
		const devMode = initializationOptions.devMode
		const compiledData = await getCompiledData(devMode);
		return new ProjectManager(workspaceRoot, compiledData, initializationOptions);
	}

	public async initialize() {
		if (this.initializationOptions.devMode) {
			assembleReadme(this.compiledData);
		}
		const rootPath = this.workspaceRoot.fsPath;
		const csvFiles = await this.findCsvFiles(rootPath);
		for (const filePath of csvFiles) {
			await this.loadFileFromDisk(filePath);
		}
	}

	public async setConfiguration(conf: DD2CSVMMDSettings) {
		this.configuration = conf;
	}

	public updateFileState(uri: string, text: string) {
		if (!uri.endsWith(".Group.csv")) {
			return;
		}
		this.openDocuments.add(uri);
		const parseResult = parseIntoAST(text, this.configuration);
		this.index.updateFileIndex(uri, parseResult.AST);
		const fileState: FileState = {
			uri: uri,
			ast: parseResult.AST,
			parseDiagnostics: parseResult.diagnostics,
			text: text,
		};
		this.files.set(uri, fileState);
		return fileState;
	}

	public async findCsvFiles(dir: string): Promise<string[]> {
		const result: string[] = [];
		const entries = await fs.promises.readdir(dir, {
			withFileTypes: true,
		});
		for (const entry of entries) {
			const filePath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				result.push(...await this.findCsvFiles(filePath));
			}
			if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
				result.push(filePath);
			}
		}
		return result;
	}

	public async updateFromDisk(uri: string) {
		if (this.openDocuments.has(uri)) {
			return;
		}
		const fsPath = URI.parse(uri).fsPath;
		const stats = await fs.promises.stat(fsPath);
		if (stats.isDirectory()) {
			for (const filePath of await this.findCsvFiles(fsPath)) {
				this.loadFileFromDisk(filePath);
			}
		}
		else {
			this.loadFileFromDisk(fsPath);
		}
	}

	public remove(uri: string) {
		this.files.delete(uri);
		this.openDocuments.delete(uri);

		const directoryPrefix = uri.endsWith('/') ? uri : `${uri}/`;
        for (const cachedUri of this.files.keys()) {
            if (cachedUri.startsWith(directoryPrefix)) {
                this.files.delete(cachedUri);
            }
        }
	}

	public get(fileUri: string): FileState | undefined {
		return this.files.get(fileUri);
	}

	public getAll(): FileState[] {
		return [...this.files.values()];
	}

	async loadFileFromDisk(filePath: string) {
		const uri = URI.file(filePath).toString();
		const text = await fs.promises.readFile(filePath, "utf8");
		this.updateFileState(uri, text);
	}

}