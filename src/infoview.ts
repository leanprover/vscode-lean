import { basename, join } from 'path';
import { readFileSync } from 'fs';
import {
    TextDocumentContentProvider, Event, EventEmitter, Disposable, Uri, Range, ExtensionContext,
    CancellationToken, DocumentSelector, TextDocument, TextEditorRevealType, Position, Selection,
    workspace, window, commands, languages
} from 'vscode';
import { InfoRecord, Message } from "lean-client-js-node";
import { Server } from './server';

function compareMessages(m1: Message, m2: Message): boolean {
    return (m1.file_name == m2.file_name &&
        m1.pos_line == m2.pos_line && m1.pos_col == m2.pos_col &&
        m1.severity == m2.severity && m1.caption == m2.caption && m1.text == m2.text);
}

// https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

enum DisplayMode {
    OnlyState, // only the state at the current cursor position including the tactic state
    AllMessage // all messages 
}

export class InfoProvider implements TextDocumentContentProvider, Disposable {
    leanGoalsUri = Uri.parse('lean-info:goals');

    private changedEmitter = new EventEmitter<Uri>();
    onDidChange = this.changedEmitter.event;

    private subscriptions: Disposable[] = [];

    private displayMode: DisplayMode = DisplayMode.AllMessage;

    private curFileName: string = null;
    private curPosition: Position = null;
    private curGoalState: string = null;
    private curMessages: Message[] = null;

    private stylesheet: string = null;

    constructor(private server: Server, private leanDocs: DocumentSelector, private context: ExtensionContext) {
        this.subscriptions.push(
            this.server.allMessages.on(() => {
                if (this.updateMessages()) this.fire();
            }),
            this.server.statusChanged.on(() => {
                this.updateGoal().then((changed) => { if (changed && this.displayGoal()) this.fire(); })
            }),
            window.onDidChangeTextEditorSelection(() => this.updatePosition()),
            commands.registerCommand('_lean.revealPosition', this.revealEditorPosition)
        );
        let css = this.context.asAbsolutePath(join('media', `infoview.css`));
        let js = this.context.asAbsolutePath(join('media', `infoview-ctrl.js`));
        // TODO: update stylesheet on configuration changes
        this.stylesheet = readFileSync(css, "utf-8") + `
            pre {
                font-family: ${workspace.getConfiguration('editor').get('fontFamily')};
                font-size: ${workspace.getConfiguration('editor').get('fontSize')}px;
            }
            ` +
            workspace.getConfiguration('lean').get('infoViewStyle');
        this.updatePosition();
    }

    dispose() {
        for (const s of this.subscriptions) s.dispose();
    }

    provideTextDocumentContent(uri: Uri, token: CancellationToken): string {
        if (uri.toString() == this.leanGoalsUri.toString()) {
            const content = this.render();
            return content;
        } else
            throw new Error(`unsupported uri: ${uri}`);
    }

    private displayGoal() : boolean {
        return this.displayMode == DisplayMode.OnlyState;
    }

    private displayPosition() : boolean {
        return this.displayMode == DisplayMode.AllMessage;
    }

    private sendPosition() {
        commands.executeCommand('_workbench.htmlPreview.postMessage', this.leanGoalsUri,
            {
                command: 'position',
                fileName: this.curFileName,
                line: this.curPosition.line + 1,
                column: this.curPosition.character
            });
    }

    private fire() {
        this.changedEmitter.fire(this.leanGoalsUri);
    }

    private revealEditorPosition(uri: Uri, line: number, column: number) {
        for (let editor of window.visibleTextEditors) {
            if (editor.document.uri.toString() === uri.toString()) {
                let pos = new Position(line, column);
                window.showTextDocument(editor.document);
                editor.revealRange(new Range(pos, pos), TextEditorRevealType.InCenterIfOutsideViewport);
                editor.selection = new Selection(pos, pos);
            }
        }
    }

    private updatePosition() {
        if (!languages.match(this.leanDocs, window.activeTextEditor.document))
            return;

        const oldFileName = this.curFileName;
        const oldPosition = this.curPosition;

        this.curFileName = window.activeTextEditor.document.fileName;
        this.curPosition = window.activeTextEditor.selection.active;

        const f = this.curFileName;
        const l = this.curPosition.line + 1;
        const c = this.curPosition.character;
        if (this.curFileName !== oldFileName || !this.curPosition.isEqual(oldPosition)) {
            const chMsg = this.updateMessages();
            switch (this.displayMode) {
            case DisplayMode.OnlyState:
                this.updateGoal().then((chGoal) => { if (chGoal || chMsg) this.fire() });
                break;

            case DisplayMode.AllMessage:
                if (chMsg) {
                    this.fire();
                } else {
                    this.sendPosition()
                }
                break;
            }
        }
    }

    private updateMessages(): boolean {
        if (!this.curFileName) return false;
        let msgs;
        switch (this.displayMode) {
        case DisplayMode.OnlyState:
            msgs = this.server.messages
                .filter((m) => m.file_name === this.curFileName &&
                    m.pos_line == this.curPosition.line + 1 &&
                    m.pos_col == this.curPosition.character);
            break;

        case DisplayMode.AllMessage:
            msgs = this.server.messages
                .filter((m) => m.file_name === this.curFileName)
                .sort((a, b) => a.pos_line === b.pos_line
                        ? a.pos_col - b.pos_col
                        : a.pos_line - b.pos_line);
            break;
        }
        if (!this.curMessages) {
            this.curMessages = msgs;
            return true;
        }
        const old_msgs = this.curMessages;
        if (msgs.length == old_msgs.length) {
            let eq = true;
            for (let i = 0; i < msgs.length; i++) {
                if (!compareMessages(msgs[i], old_msgs[i])) {
                    eq = false;
                    break;
                }
            }
            if (eq) return false;
        }
        this.curMessages = msgs;
        return true;
    }

    private updateGoal(): Promise<boolean> {
        const f = this.curFileName;
        const l = this.curPosition.line + 1;
        const c = this.curPosition.character;

        return this.server.info(f, l, c).then((info) => {
            if (info.record && info.record.state) {
                if (this.curGoalState !== info.record.state) {
                    this.curGoalState = info.record.state;
                    return true;
                }
            } else {
                if (this.curGoalState) {
                    this.curGoalState = null;
                    return false;
                }
            }
        });
    }

    private getMediaPath(mediaFile: string): string {
        return Uri.file(this.context.asAbsolutePath(join('media', mediaFile))).toString();
    }

    private render() {
        return `<!DOCTYPE html>
            <html>
            <head> 
              <meta http-equiv="Content-type" content="text/html;charset=utf-8">
              <style>${escapeHtml(this.stylesheet)}</style>
              <script charset="utf-8" src="${this.getMediaPath("infoview-ctrl.js")}"></script>
            </head>
            <body
                data-fileName="${escapeHtml(this.curFileName)}"
                data-line="${(this.curPosition.line + 1).toString()}"
                data-column="${this.curPosition.character.toString()}"
                data-displyMode="${this.displayMode.toString()}">
              <div id="debug"></div>
              ${this.renderGoal()}
              <div id="messages">${this.renderMessages()}</div>
            </body></html>`;
    }

    private renderGoal() {
        if (!this.curGoalState || this.displayMode !== DisplayMode.OnlyState) return '';
        return `<div id="goal"><h1>Tactic State</h1><pre>${escapeHtml(this.curGoalState)}</pre></div>`;
    }

    private renderMessages() {
        if (!this.curFileName) return ``;
        return this.curMessages.map((m) => {
            let header = this.displayPosition()
                ? `<a href="${encodeURI('command:_lean.revealPosition?' +
                  JSON.stringify([Uri.file(m.file_name), m.pos_line - 1, m.pos_col]))}">
                  ${escapeHtml(basename(m.file_name))}:${m.pos_line.toString()}:${m.pos_col.toString()}:
                  ${m.severity} ${escapeHtml(m.caption)}</a>`
                : `${m.severity}: ${escapeHtml(m.caption)}`;
            return `<div class="message ${m.severity}"
                    data-line="${m.pos_line.toString()}"
                    data-column="${m.pos_col.toString()}">
                  <h1>${header}</h1>
                  <pre>${escapeHtml(m.text)}</pre>
                </div>`
        }).join("\n");
    }
}