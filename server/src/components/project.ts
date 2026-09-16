import { URI } from 'vscode-uri'
import * as path from 'node:path';
import * as fs from "node:fs"
import { Range } from 'vscode-languageserver';

import { ERType, Index, KeyInfo } from '.';
import { AST, ASTElement, ElementNumberID, GameType, gameTypeList, MmdDiagnostic, offsetElementByLines, Parser } from './parser';
import { DD2CSVMMDSettings } from '../../../shared/settings';
import { makePathString, makeUriString, UriString } from '../../../shared/utils';
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
	readonly files: Map<UriString, FileState>;
	readonly parser: Parser;
	readonly index: Index;
	readonly analyzer: Semantic;
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

	public async initialize(workspaceRoot: URI | null) {
		const t0 = performance.now();
		const dirs = [...this.configuration.externalDirectories];
		if (workspaceRoot) {
			dirs.unshift(workspaceRoot.fsPath);
		}
		const gettingDirs = dirs.map(dir => this.findCsvFiles(dir)).flat();
		const filepaths = [...new Set(gettingDirs.map(makePathString))];
		// parse all files
		let fileReadingTime = 0;
		let textParsingTime = 0;
		for (const filepath of filepaths) {
			const fileReadingTimeStart = performance.now();
			const uri = makeUriString(URI.file(filepath).toString());
			const text = fs.readFileSync(filepath).toString('utf8');
			fileReadingTime += performance.now() - fileReadingTimeStart;
			const textParsingTimeStart = performance.now();
			const parseResult = this.parser.parseIntoAST(uri, text);
			textParsingTime += performance.now() - textParsingTimeStart;
			this.files.set(uri, {
				uri: uri,
				ast: parseResult.AST,
				parseDiagnostics: parseResult.diagnostics,
				open: false,
				text: text,
			});
		};
		const validationTimeStart = performance.now();
		// get emitters from all files
		for (const fileState of this.files.values()) {
			for (const element of fileState.ast) {
				const solveResult = this.index.indexElement(fileState.uri, element);
				this.index.addElement(element, solveResult.emitters, solveResult.receivers, false);
			}
		}
		// semantic analysis for all files
		for (const fileState of this.files.values()) {
			for (const element of fileState.ast) {
				this.analyzer.solveElement(element);
			}
		}
		const totalDuration = (performance.now() - t0).toFixed(1);
		const validationDuration = (performance.now() - validationTimeStart).toFixed(1);
		console.log(`Initialized project with ${this.files.size} files [${totalDuration} ms], including:` +
			`\n\t- File reading [${fileReadingTime.toFixed(1)} ms]` +
			`\n\t- Text parsing [${textParsingTime.toFixed(1)} ms]` +
			`\n\t- Initial validation [${validationDuration} ms]`);
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
			const affected = this.index.addElement(element, elementIndex.emitters, elementIndex.receivers, true);
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
			const message = `The number of elements in the model AST (${fileState.ast.length}) does not` +
			`match the number of elements in the actual AST (${newAstResult.AST.length}).`
			this.replaceWholeFile(uri, newText, true);
			console.error(message);
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
		console.log(`Removed ${urisToRemove.length} file(s) from project [${duration} ms]. `+
			`Affected ${affected.size} elements. ${this.files.size} files remain.`);
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
		console.log(`Added/updated ${filePathsToUpdate.length} file(s) [${duration} ms]. ` +
			`Affected ${affected.size} elements. ${this.files.size} files in project.`);
		return;
	}

	public getElementText(element: ASTElement, maxLines=12): string | null {
		const uri = this.index.getUriFromElement(element);
		if (!uri) {
			return null;
		}
		const file = this.getFileState(uri);
		if (!file) {
			return null;
		}
		const range = element.fullRange;
		const elementLines = file.text.split('\n').slice(range.start.line, range.end.line + 1);
		if (elementLines.length > maxLines) {
			elementLines.splice((maxLines - 2), (elementLines.length - maxLines + 1), '...');
		}
		return `\`\`\`DD2MMD\n${elementLines.join('\n')}\n\`\`\``;
	}

	public findSupplementaryElementsForAllGameTypes(element: ASTElement) {
		const supplementsByGameType = gameTypeList.map(gameType => this.findSupplementaryElements(element, gameType));
		return [...new Set(supplementsByGameType.flat())];
	}

	/**
	 * Searches supplementary elements (from defining element to dependent element).
	 * 
	 * For Buff elements it searches for ActorDataStats, ActorDataEffects, etc. elements.
	 * 
	 * For ActorDataStats it does not search for Buff elements.
	 */
	public findSupplementaryElements(element: ASTElement, gameType: GameType) {
		const result = [];
		const elementDefinition = this.compiledData.schema[element.elementType];
		const supplements = elementDefinition?.supplementedBy ?? [];
		for (const supplement of supplements) {
			const key: KeyInfo = { type: ERType.id, group: supplement, name: element.name };
			const emitters = this.index.findEmitters(gameType, key);
			for (const emitter of emitters) {
				const supplementElement = this.index.getElementByNumericId(emitter.ownerId);
				if (supplementElement) {
					result.push(supplementElement);
				}
			}
		}
		return result;
	}

	/**
	 * Searches supplementary elements (both ways).
	 * 
	 * For Buff elements it searches for ActorDataStats, ActorDataEffects, etc. elements.
	 * 
	 * For ActorDataStats it searches for Buff, ActorDataSkill, BiomeUpgrade, etc. elements.
	 */
	public findSameIdConnectedElementsForAllGameTypes(element: ASTElement) {
		const connections = [];
		const allElementTypes = Object.keys(this.compiledData.schema);
		for (const elementType of allElementTypes) {
			const elementDefinition = this.compiledData.schema[elementType];
			const supplementedBy = elementDefinition?.supplementedBy;
			if (!supplementedBy) {
				continue;
			}
			if (elementType === element.elementType) {
				connections.push(...elementDefinition.supplementedBy);
			}
			else {
				if (supplementedBy.includes(element.elementType)) {
					connections.push(elementType);
				}
			}
		}
		const result = new Set<ASTElement>();
		for (const connectedType of connections) {
			for (const gameType of gameTypeList) {
				const key: KeyInfo = { type: ERType.id, group: connectedType, name: element.name };
				const emitters = this.index.findEmitters(gameType, key);
				for (const emitter of emitters) {
					const supplementElement = this.index.getElementByNumericId(emitter.ownerId);
					if (supplementElement) {
						result.add(supplementElement);
					}
				}
			}
		}
		return [...result];
	}

	/**
	 * Returns a Set of numeric IDs of elements affected by update.
	 */
	private async updateFileFromDisk(filePath: string): Promise<Set<ElementNumberID>> {
		if (!this.isDd2Csv(filePath)) {
			return new Set();
		}
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
			const affectedByElement = this.index.addElement(element, elementIndex.emitters, elementIndex.receivers, true);
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

	private findCsvFiles(dir: string): string[] {
		const result: string[] = [];
		if (!fs.existsSync(dir)) {
			return result;
		}
		const entries = fs.readdirSync(dir, {
			withFileTypes: true,
		});
		for (const entry of entries) {
			const filePath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				result.push(...this.findCsvFiles(filePath));
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
