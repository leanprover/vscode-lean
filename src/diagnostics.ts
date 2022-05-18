import { Message, Severity } from 'lean-client-js-node';
import { Diagnostic, DiagnosticCollection, DiagnosticSeverity,
    Disposable, languages, Position, Range, TextDocument, Uri, workspace } from 'vscode';
import { Server } from './server';
import { CodePointPosition } from './utils/utf16Position';

function toSeverity(severity: Severity): DiagnosticSeverity {
    switch (severity) {
        case 'warning': return DiagnosticSeverity.Warning;
        case 'error': return DiagnosticSeverity.Error;
        case 'information': return DiagnosticSeverity.Information;
        default: return DiagnosticSeverity.Error;
    }
}

const MAX_MESSAGES = 2**13;
const MAX_MESSAGE_SIZE = 2**18;
function truncateMessages(msgs: Message[]): Message[] {
    if (msgs.length >= MAX_MESSAGES) {
        msgs = msgs.slice(0, MAX_MESSAGES - 1);
        msgs.push({
            ...msgs.pop(),
            severity: 'error',
            caption: undefined,
            text: `Too many errors, only showing the first ${MAX_MESSAGES}.`,
        });
    }
    msgs = msgs.map((msg) => ({
        ...msg,
        text: msg.text.length <= MAX_MESSAGE_SIZE ? msg.text :
            msg.text.slice(0, MAX_MESSAGE_SIZE) +
                `\n(message too long, truncated at ${MAX_MESSAGE_SIZE} characters)`,
    }));
    return msgs;
}

export class LeanDiagnosticsProvider implements Disposable {
    collection: DiagnosticCollection;
    private subscriptions: Disposable[] = [];

    constructor(server: Server) {
        this.collection = languages.createDiagnosticCollection('lean');
        this.subscriptions.push(this.collection);

        this.subscriptions.push(
            server.allMessages.on((msgs) => this.updateDiagnostics(msgs.msgs)));

        this.subscriptions.push(server.restarted.on(() => this.updateDiagnostics([])));
    }

    private updateDiagnostics(messages: Message[]) {
        const diagnosticMap = new Map<string, Diagnostic[]>();
        const docMap = new Map<string, TextDocument>();

        // HACK: limit number and size of messages, see
        // https://leanprover.zulipchat.com/#narrow/stream/113488-general/topic/folding.20problems.20problem
        messages = truncateMessages(messages);

        for (const message of messages) {
            // Assign the diagnostic to the entire word following the info message
            // so that code actions can be activated more easily
            let msgDoc = docMap.get(message.file_name);
            if (!msgDoc) {
                msgDoc = workspace.textDocuments.find((doc) => doc.fileName === message.file_name);
                docMap.set(message.file_name, msgDoc);
            }
            const pos = new CodePointPosition(Math.max(message.pos_line - 1, 0), message.pos_col);
            const endPos = message.end_pos_col !== undefined
                ? new CodePointPosition(Math.max(message.end_pos_line - 1, 0), message.end_pos_col)
                : undefined;
            const utf16Pos = pos.toPosition(msgDoc);
            const utf16EndPos = endPos?.toPosition(msgDoc);
            const range = endPos
                ? new Range(utf16Pos, utf16EndPos)
                : msgDoc.getWordRangeAtPosition(utf16Pos) || new Range(utf16Pos, utf16Pos);
            let diagnostics = diagnosticMap.get(message.file_name);
            if (!diagnostics) { diagnosticMap.set(message.file_name, diagnostics = []); }
            const d = new Diagnostic(range, message.text,
                toSeverity(message.severity));
            d.source = 'Lean';
            diagnostics.push(d);
        }

        const fileNameToUri = new Map<string, Uri>();
        for (const doc of workspace.textDocuments) {
            fileNameToUri.set(doc.fileName, doc.uri);
        }

        this.collection.clear();
        diagnosticMap.forEach((diags, file) =>
            this.collection.set(fileNameToUri.get(file), diags));
    }

    dispose(): void {
        for (const s of this.subscriptions) { s.dispose(); }
     }
}
