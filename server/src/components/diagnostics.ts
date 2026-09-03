import { DD2CSVMMDSettings } from '../../../shared/settings';
import { mapGetOrSet, UriString } from '../../../shared/utils';
import { DiagnosticType, MmdDiagnostic } from './parser';
import { FileState } from './project';
import { Diagnostic, PublishDiagnosticsParams } from 'vscode-languageserver/node';

type DiagnosticsSender = (params: PublishDiagnosticsParams) => Promise<void>;

export class DiagnosticsPublisher {
	private readonly diagnosticsPublished = new Map<UriString, Diagnostic[]>();

	public async publishDiagnostics(files: FileState[], sender: DiagnosticsSender, configuration: DD2CSVMMDSettings): Promise<void> {
		const t0 = performance.now();
		const updatedFiles = [];
		for (const fileState of files) {
			const fileDiagnostics = [fileState.parseDiagnostics, fileState.ast.map(e => e.diagnostics)].flat(2);
			const fileDiagnosticsFiltered = this.filterDiagnostics(fileDiagnostics, configuration);
			if (this.needToUpdateFileDiagnostics(fileState.uri, fileDiagnosticsFiltered)) {
				await sender({
					uri: fileState.uri,
					diagnostics: fileDiagnosticsFiltered,
				});
				updatedFiles.push(fileState);
				this.diagnosticsPublished.set(fileState.uri, fileDiagnosticsFiltered);
			}
		}
		const duration = (performance.now() - t0).toFixed(1);
		console.info(`Publishing diagnostics [${duration} ms]. Updated diagnostics in ${updatedFiles.length} out of ${files.length} files.`);
	}

	private needToUpdateFileDiagnostics(uri: UriString, newDiagnostics: Diagnostic[]): boolean {
		const alreadyPublishedDiagnostics = mapGetOrSet(this.diagnosticsPublished, uri, []);
		return !this.arraysEqualShallow(newDiagnostics, alreadyPublishedDiagnostics);
	}

	private arraysEqualShallow<T>(a: T[], b: T[]): boolean {
		if (a === b) return true;
		if (a.length !== b.length) return false;
		return a.every((val, index) => val === b[index]);
	}

	private filterDiagnostics(diagnostics: MmdDiagnostic[], configuration: DD2CSVMMDSettings): Diagnostic[] {
		const result: Diagnostic[] = [];
		const features = configuration.features;
		for (const d of diagnostics) {
			if (
				   (features.validationFieldValues		&& (d.flags & DiagnosticType.FieldValue))
				|| (features.validationFieldEmpty		&& (d.flags & DiagnosticType.EmptyField))
				|| (features.validationElementBoundary	&& (d.flags & DiagnosticType.ElementBoundary))
				|| (features.validationElementType		&& (d.flags & DiagnosticType.ElementType))
				|| (features.validationFieldName		&& (d.flags & DiagnosticType.FieldName))
				|| (features.validationComments 		&& (d.flags & DiagnosticType.Comment))
				|| (features.validationAddables			&& (d.flags & DiagnosticType.NotAddable))
			) {
				result.push(d.diagnostic);
			}
		}
		return result;
	}
}

