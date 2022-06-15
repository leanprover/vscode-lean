import { SymbolResponse } from 'lean-client-js-core';
import { CancellationToken, Definition, DefinitionProvider, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument, Uri, workspace } from 'vscode';
import { Server } from './server';
import { InsertTextMessage } from './shared';
import { CodePointPosition } from './utils/utf16Position';
import { toSymbolKind } from './utils/symbolKinds';

export class LeanDocumentSymbolProvider implements DocumentSymbolProvider {
    server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    async provideDocumentSymbols(document: TextDocument, token: CancellationToken): Promise<DocumentSymbol[]> {
        const response : SymbolResponse = await this.server.symbols(document.fileName);
        const infos : DocumentSymbol[] = [];

        // Rather than outputting a tree of namespaces, we track the current stack which more accurately
        // models the way that namespaces are opened, closed, and reopened in Lean. This makes "sort by position"
        // more useful in the outline view, but "sort by name" less useful.
        let stack : DocumentSymbol[] = [];

        for (const item of response.results) {
            if (!(item.source && item.source.file && item.source.line && item.source.column)) continue;

            const pos = new CodePointPosition(item.source.line - 1, item.source.column).toPosition(document);
            const range = new Range(pos, pos);

            // Pop as much stack as necessary
            let i = 0;
            for (; i < item.name_parts.length && i < stack.length; i++) {
                if (stack[i].name !== item.name_parts[i]) {
                    break
                }
            }
            stack = stack.slice(0, i);
            for (; i < item.name_parts.length; i++) {
                const curr = new DocumentSymbol(item.name_parts[i], null, SymbolKind.Namespace, range, range);
                if (i > 0) {
                    stack[i - 1].children.push(curr)
                }
                else {
                    infos.push(curr);
                }
                stack.push(curr)
            }

            stack[stack.length-1].kind = toSymbolKind(item.kind);
            stack[stack.length-1].detail = item.type;
        }

        return infos;
    }
}
