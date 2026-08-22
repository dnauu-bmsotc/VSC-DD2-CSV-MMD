import { URI } from 'vscode-uri'
import * as path from 'node:path';
import * as fs from "node:fs"

import { Index, indexElements, newIndex } from './indexer';
import { AST, parseIntoAST } from './parser';
import { CompiledData, getCompiledData } from './compiler';
import { DD2CSVMMDInitializationSettings, DD2CSVMMDSettings, defaultConfiguration } from '../../../shared/settings';
import { assembleReadme } from './readme';
import { Diagnostic } from 'vscode-languageserver';

interface FileState {
	uri: string;
	ast: AST;
	index: Index;
	parseDiagnostics: Diagnostic[];
}

export class ProjectManager {
	readonly files = new Map<string, FileState>();
	compiledData: CompiledData;
	initializationOptions: DD2CSVMMDInitializationSettings;
	workspaceRoot: URI;
	configuration: DD2CSVMMDSettings;

	private constructor(workspaceRoot: URI, compiledData: CompiledData, initializationOptions: DD2CSVMMDInitializationSettings) {
		this.compiledData = compiledData;
		this.workspaceRoot = workspaceRoot;
		this.initializationOptions = initializationOptions;
		this.configuration = defaultConfiguration;
	}

	public static async create(workspaceRoot: URI, initializationOptions: DD2CSVMMDInitializationSettings): Promise<ProjectManager> {
		const devMode = initializationOptions.devMode
		const compiledData = await getCompiledData(devMode, true);
		return new ProjectManager(workspaceRoot, compiledData, initializationOptions);
	}

	public async initialize() {
		if (this.initializationOptions.devMode) {
			assembleReadme(this.compiledData);
		}
		const rootPath = this.workspaceRoot.fsPath;
		const csvFiles = await this.findCsvFiles(rootPath);
		for (const filePath of csvFiles) {
			await this.loadFromDisk(filePath);
		}
	}

	public async setConfiguration(conf: DD2CSVMMDSettings) {
		this.configuration = conf;
	}

	public updateFileState(uri: string, text: string) {
		if (!uri.endsWith(".csv")) {
			return;
		}
		const parseResult = parseIntoAST(text, this.configuration);
		const index = newIndex();
		indexElements(index, this.compiledData.schema, parseResult.AST, this.compiledData.keywords);
		const fileState = {
			uri: uri,
			ast: parseResult.AST,
			index: index,
			parseDiagnostics: parseResult.diagnostics,
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

	public async loadFromDisk(filePath: string) {
		const uri = URI.file(filePath).toString();
		const text = await fs.promises.readFile(filePath, "utf8");
		this.updateFileState(uri, text);
	}

	public async updateFromDisk(uri: string) {
		return this.loadFromDisk(URI.parse(uri).fsPath);
	}

	public remove(uri: string) {
		this.files.delete(uri);
	}

	public get(uri: string): FileState | undefined {
		return this.files.get(uri);
	}

	public getAll(): FileState[] {
		return [...this.files.values()];
	}
}