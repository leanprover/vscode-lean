import { HoleCommands, HoleResponse } from 'lean-client-js-core';
import { CodeActionProvider, Command, commands, Diagnostic,
    DiagnosticCollection, DiagnosticSeverity, Disposable, DocumentSelector, languages,
    Range, TextDocument, TextEditor, Uri, window } from 'vscode';
import { Server } from './server';
import { CodePointPosition } from './utils/utf16Position';

interface Pos { line: number; column: number }
interface Ran { start: Pos; end: Pos }
function mkRange(doc: TextDocument, r: Ran): Range {
    const startPos = new CodePointPosition(r.start.line - 1, r.start.column);
    const endPos = new CodePointPosition(r.end.line - 1, r.end.column);
    return new Range(startPos.toPosition(doc), endPos.toPosition(doc));
}

export class LeanHoles implements Disposable, CodeActionProvider {
    private holes: [TextDocument, HoleCommands][] = [];
    private collection: DiagnosticCollection;
    private subscriptions: Disposable[] = [];

    private executeHoleCommand = 'lean.executeHole';

    constructor(private server: Server, private leanDocs: DocumentSelector) {
        this.subscriptions.push(
            this.collection = languages.createDiagnosticCollection('lean holes'),
            commands.registerCommand(this.executeHoleCommand, (file, line, column, action) =>
                this.execute(file, line, column, action)),
            languages.registerCodeActionsProvider(this.leanDocs, this),
            window.onDidChangeVisibleTextEditors(() => this.refresh()),
            this.server.statusChanged.on(() => this.refresh()),
        );
    }

    private async refresh() {
        if (!this.server.alive()) { return; }
        try {
            const leanEditor = window.visibleTextEditors .filter((editor) =>
                languages.match(this.leanDocs, editor.document));
            const ress = await Promise.all(leanEditor
                .map((editor) =>  this.server.allHoleCommands(editor.document.fileName).then
                    ((holes) : [TextDocument, any] => [editor.document, holes])));

            this.holes = [];
            for (const [document, res] of ress) {
                for (const hole of res.holes) {
                    this.holes.push([document, hole]);
                }
            }

            const holesPerFile = new Map<string, [TextDocument, HoleCommands][]>();
            for (const [document, hole] of this.holes) {
                if (!holesPerFile.get(hole.file)) { holesPerFile.set(hole.file, []); }
                holesPerFile.get(hole.file).push([document, hole]);
            }

            this.collection.clear();
            for (const file of holesPerFile.keys()) {
                this.collection.set(Uri.file(file),
                    holesPerFile.get(file).map(([editor, hole]) =>
                        new Diagnostic(mkRange(editor, hole),
                            'Hole: ' + hole.results.map((a) => a.name).join('/'),
                            DiagnosticSeverity.Hint)));
            }
        } catch (e) {
            console.log('ignoring error in refresh: ' + e);
        }
    }

    private async execute(file: string, line: number, column: number, action: string) {
        let res: HoleResponse;
        try {
            res = await this.server.hole(file, line, column, action);
        } catch (e) {
            return window.showErrorMessage(`Error while executing hole command: ${e}`);
        }

        if (res.message) {
            void window.showInformationMessage(res.message);
        }
        if (res.replacements && res.replacements.alternatives) {
            // TODO(gabriel): ask user if more than one alternative
            for (const editor of window.visibleTextEditors) {
                if (editor.document.fileName === file) {
                    await editor.edit((builder) => {
                        builder.replace(mkRange(editor.document, res.replacements),
                            res.replacements.alternatives[0].code);
                    });
                }
            }
        }
    }

    provideCodeActions(document: TextDocument, range: Range): Command[] {
        const cmds: Command[] = [];
        for (const [document, hole] of this.holes) {
            if (!range.intersection(mkRange(document, hole))) { continue; }
            for (const action of hole.results) {
                cmds.push({
                    title: action.description,
                    command: this.executeHoleCommand,
                    arguments: [hole.file, hole.start.line, hole.start.column, action.name],
                });
            }
        }
        return cmds;
    }

    dispose(): void {
        for (const s of this.subscriptions) { s.dispose(); }
    }
}
