import { URI } from 'vscode-uri'
import * as path from 'node:path';
import * as fs from "node:fs"
import { Range } from 'vscode-languageserver';

import { Index } from '.';
import { AST, ASTElement, ElementNumberID, MmdDiagnostic, offsetElementByLines, Parser } from './parser';
import { DD2CSVMMDSettings } from '../../../shared/settings';
import { makeUriString, UriString } from '../../../shared/utils';
import { Semantic } from './semantic';
import { CompiledData } from './schema';

export interface FileState {
	uri: UriString;
	ast: AST;
	open: boolean;
	parseDiagnostics: MmdDiagnostic[];
	text: string;
}

export class ProjectManager {
	readonly compiledData: CompiledData;
	private configuration: DD2CSVMMDSettings;
	private readonly files: Map<UriString, FileState>;
	private readonly parser: Parser;
	private readonly index: Index;
	private readonly analyzer: Semantic;
	protected ready = false;

	get isReady(): boolean {
		return this.ready;
	}

	public getConfiguration() {
		return this.configuration;
	}

	constructor(compiledData: CompiledData, configuration: DD2CSVMMDSettings) {
		this.compiledData = compiledData;
		this.configuration = configuration;
		this.files = new Map<UriString, FileState>();
		this.parser = new Parser();
		this.index = new Index(this.compiledData.schema, this.compiledData.keywords);
		this.analyzer = new Semantic(this.compiledData.schema, this.compiledData.keywords, this.index);
	}

	public async initialize(workspaceRoot: URI) {
		const t0 = performance.now();
		const dirs = [workspaceRoot.fsPath, ...this.configuration.externalDirectories];
		const gettingDirs = dirs.map(async dir => await this.findCsvFiles(dir));
		const filepaths = (await Promise.all(gettingDirs)).flat(2);
		// parse all files
		for (const filepath of filepaths) {
			const uri = makeUriString(URI.file(filepath).toString());
			const text = await fs.promises.readFile(filepath, "utf8");
			const parseResult = this.parser.parseIntoAST(uri, text);
			this.files.set(uri, {
				uri: uri,
				ast: parseResult.AST,
				parseDiagnostics: parseResult.diagnostics,
				open: false,
				text: text,
			});
		}
		// get emitters from all files
		for (const fileState of this.files.values()) {
			for (const element of fileState.ast) {
				const solveResult = this.index.indexElement(fileState.uri, element);
				this.index.addElement(element, solveResult.emitters, solveResult.receivers);
			}
		}
		// semantic analysis for all files
		for (const fileState of this.files.values()) {
			for (const element of fileState.ast) {
				this.analyzer.solveElement(element);
			}
		}
		const duration = (performance.now() - t0).toFixed(1);
		console.log(`Initialized project with ${filepaths.length} files [${duration} ms].`);
		this.ready = true;
	}

	public setConfiguration(configuration: DD2CSVMMDSettings) {
		const oldConfig = this.configuration;
		const newConfig = structuredClone(configuration);

		if ((JSON.stringify(oldConfig.externalDirectories) !== JSON.stringify(newConfig.externalDirectories))) {
			for (const dir of oldConfig.externalDirectories) {
				const uri = makeUriString(URI.file(dir).toString());
				this.remove(uri);
			}
			for (const dir of newConfig.externalDirectories) {
				const uri = makeUriString(URI.file(dir).toString());
				this.updateFromDisk(uri);
			}
		}
		
		this.configuration = newConfig;
	}

	public getFileState(uri: UriString) {
		return this.files.get(uri);
	}

	public getAllFileStates() {
		return this.files.values();
	}

	public openDocument(uri: UriString): void {
		const fileState = this.files.get(uri);
		if (fileState) {
			fileState.open = true;
		}
	}

	public closeDocument(uri: UriString): void {
		const fileState = this.files.get(uri);
		if (fileState) {
			fileState.open = false;
		}
	}

	public updateDocument(uri: UriString, newText: string): void {
		const fileState = this.files.get(uri);
		if (!fileState) {
			this.replaceWholeFile(uri, newText, true);
			return;
		}

		const t0 = performance.now();
		const affectedIds = new Set<ElementNumberID>();

		// find elements affected by removal
		const changeRegion = this.getChangeRegion(fileState.text, newText);
		const removedIds = new Set<ElementNumberID>();
		for (const element of fileState.ast) {
			if (this.rangesOverlap(element.fullRange, changeRegion.oldRange)) {
				removedIds.add(element.id);
				const affected = this.index.removeElement(element);
				for (const id of affected) {
					affectedIds.add(id);
				}
			}
		}

		// get edited elements
		const newAstResult = this.parser.parseIntoAST(uri, newText);
		const replacementElements = newAstResult.AST.filter(element => this.rangesOverlap(changeRegion.newRange, element.fullRange));

		// compose edited file
		this.modifyOldAst(fileState.ast, changeRegion, removedIds, replacementElements);
		this.files.set(uri, {
			uri: uri,
			ast: fileState.ast,
			open: true,
			parseDiagnostics: newAstResult.diagnostics,
			text: newText,
		});

		// find elements affected by addition
		for (const element of replacementElements) {
			const elementIndex = this.index.indexElement(uri, element);
			const affected = this.index.addElement(element, elementIndex.emitters, elementIndex.receivers);
			for (const id of affected) {
				affectedIds.add(id);
			}
			affectedIds.add(element.id);
		}

		this.reanalyzeIds(affectedIds);

		const duration = (performance.now() - t0).toFixed(1);
		const memoryUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
		console.log(`Document update (${uri.replace(/^.*[\\/]/, '')}) [${duration} ms] [${memoryUsed} MB].`,
			`Removed ${[...removedIds].length} element(s).`,
			`Added ${replacementElements.length} element(s).`,
			`Affected ${[...affectedIds].length} element(s).`,
		);

		if (newAstResult.AST.length !== fileState.ast.length) {
			console.error(`The number of elements in the model AST (${fileState.ast.length}) does not match the number of elements in the actual AST (${newAstResult.AST.length}).`);
		}
		return;
	}

	public async remove(uri: UriString): Promise<void> {
		const t0 = performance.now();
		const uriAsDirectory = uri.endsWith('/') ? uri : `${uri}/`;
		const urisInDirectory = [...this.files.keys()].filter(uri => uri.startsWith(uriAsDirectory));
		const urisToRemove = [uri, ...urisInDirectory].filter(uri => !!this.files.get(uri));
		const affected: Set<ElementNumberID> = new Set();
		for (const uriToRemove of urisToRemove) {
			const fileState = this.files.get(uriToRemove);
			if (!fileState) {
				continue;
			}
			for (const element of fileState.ast) {
				const affectedByElementRemoval = this.index.removeElement(element);
				for (const id of affectedByElementRemoval) {
					affected.add(id);
				}
			}
			this.files.delete(uriToRemove);
		}
		const duration = (performance.now() - t0).toFixed(1);
		console.log(`Removed ${urisToRemove.length} file(s) from project [${duration} ms]. Affected ${affected.size} elements. ${this.files.size} files remain.`);
		this.reanalyzeIds(affected);
		return;
	}

	public async updateFromDisk(uri: UriString): Promise<void> {
		const t0 = performance.now();
		const fsPath = URI.parse(uri).fsPath;
		const stats = await fs.promises.stat(fsPath);

		const affected = new Set<ElementNumberID>();
		const filePathsToUpdate = stats.isDirectory() ? (await this.findCsvFiles(fsPath)) : [fsPath];
		for (const filePath of filePathsToUpdate) {
			const affectedByFile = await this.updateFileFromDisk(filePath);
			affectedByFile.forEach(id => affected.add(id));
		}
		const duration = (performance.now() - t0).toFixed(1);
		console.log(`Added/updated ${filePathsToUpdate.length} file(s) [${duration} ms]. Affected ${affected.size} elements. ${this.files.size} files in project.`);
		return;
	}

	/**
	 * Returns a Set of numeric IDs of elements affected by update.
	 */
	private async updateFileFromDisk(filePath: string): Promise<Set<ElementNumberID>> {
		const uri = makeUriString(URI.file(filePath).toString());
		const fileState = this.files.get(uri);
		if (fileState?.open) {
			return new Set();
		}
		const text = await fs.promises.readFile(filePath, "utf8");
		return this.replaceWholeFile(uri, text, false);
	}

	/**
	 * Returns a Set of numeric IDs of elements affected by update.
	 */
	private replaceWholeFile(uri: UriString, text: string, open: boolean): Set<ElementNumberID> {
		const oldFileState = this.files.get(uri);
		const affected = new Set<ElementNumberID>();
		if (oldFileState) {
			for (const element of oldFileState.ast) {
				const affectedByElementRemoval = this.index.removeElement(element);
				for (const id of affectedByElementRemoval) {
					affected.add(id);
				}
			}
		}
		this.addFile(uri, text, open);
		return affected;
	}

	/**
	 * Returns a Set of numeric IDs of elements affected by addition.
	 */
	private addFile(uri: UriString, text: string, open: boolean): Set<ElementNumberID> {
		const parseResult = this.parser.parseIntoAST(uri, text);
		this.files.set(uri, {
			uri: uri,
			ast: parseResult.AST,
			parseDiagnostics: parseResult.diagnostics,
			open: open,
			text: text,
		});
		const affected = new Set<ElementNumberID>();
		for (const element of parseResult.AST) {
			const elementIndex = this.index.indexElement(uri, element);
			const affectedByElement = this.index.addElement(element, elementIndex.emitters, elementIndex.receivers);
			for (const id of affectedByElement) {
				affected.add(id);
			}
			affected.add(element.id);
		}
		this.reanalyzeIds(affected);
		return affected;
	}

	private reanalyzeIds(ids: Set<ElementNumberID>) {
		for (const id of ids) {
			const element = this.index.getElementByNumericId(id);
			if (element) {
				this.analyzer.solveElement(element);
			}
		}
	}

	private async findCsvFiles(dir: string): Promise<string[]> {
		const result: string[] = [];
		if (!fs.existsSync(dir)) {
			return result;
		}
		const entries = await fs.promises.readdir(dir, {
			withFileTypes: true,
		});
		for (const entry of entries) {
			const filePath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				result.push(...await this.findCsvFiles(filePath));
			}
			if (entry.isFile() && this.isDd2Csv(entry.name)) {
				result.push(filePath);
			}
		}
		return result;
	}

	private isDd2Csv(filename: string) {
		return filename.toLowerCase().endsWith(".group.csv");
	}

	private getChangeRegion(oldText: string, newText: string): ChangeRegion {
		const oldLines = oldText.split('\n');
		const newLines = newText.split('\n');
		let startLine = 0;
		while ((startLine < oldLines.length) && (startLine < newLines.length) && (oldLines[startLine] === newLines[startLine])) {
			startLine += 1;
		}
		let endLineOld = oldLines.length - 1;
		let endLineNew = newLines.length - 1;
		while ((endLineOld >= startLine) && (endLineNew >= startLine) && (oldLines[endLineOld] === newLines[endLineNew])) {
			endLineOld -= 1;
			endLineNew -= 1;
		}
		// start line less than end line by 1 is produced when range tries to describe range between lines.
		startLine  = startLine > endLineNew ? (startLine + endLineNew) / 2 : startLine;
		endLineNew = startLine > endLineNew ? (startLine + endLineNew) / 2 : endLineNew;
		endLineOld = startLine > endLineOld ? (startLine + endLineOld) / 2 : endLineOld;
		return {
			oldRange: {
				start: { line: startLine, character: 0 },
				end: { line: endLineOld, character: Number.MAX_SAFE_INTEGER },
			},
			newRange: {
				start: { line: startLine, character: 0 },
				end: { line: endLineNew, character: Number.MAX_SAFE_INTEGER },
			},
			offset: newLines.length - oldLines.length,
		}
	}

	private rangesOverlap(a: Range, b: Range): boolean {
		return ((a.start.line <= b.end.line) && (b.start.line <= a.end.line));
	}

	private modifyOldAst(oldAst: AST, changeRegion: ChangeRegion, removedIds: Set<ElementNumberID>, replacementElements: ASTElement[]): void {
		// find the first element that needs to be replaced
		let firstIdxToRemove = 0;
		while ((firstIdxToRemove < oldAst.length) && (oldAst[firstIdxToRemove].fullRange.end.line < changeRegion.oldRange.start.line)) {
			firstIdxToRemove += 1;
		}
		// fix ranges that are saved in elements located after the change region because lines can be added or removed in the middle of text.
		let i = oldAst.length - 1;
		while ((i >= 0) && (oldAst[i].fullRange.start.line >= changeRegion.oldRange.end.line)) {
			offsetElementByLines(oldAst[i], changeRegion.offset);
			i -= 1;
		}
		oldAst.splice(firstIdxToRemove, removedIds.size, ...replacementElements);
	}
}

interface ChangeRegion {
	oldRange: Range;
	newRange: Range;
	offset: number;
}
