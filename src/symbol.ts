import { SymbolResponse } from 'lean-client-js-core';
import { CancellationToken, Definition, DefinitionProvider, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, Range, SymbolInformation, SymbolKind, TextDocument, Uri, workspace } from 'vscode';
import { Server } from './server';
import { InsertTextMessage } from './shared';
import { CodePointPosition } from './utils/utf16Position';

export class LeanDocumentSymbolProvider implements DocumentSymbolProvider {
    server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    toSymbolKind (s: string ) : SymbolKind {
        switch (s) {
            case 'constructor': return SymbolKind.Constructor;
            case 'projection': return SymbolKind.Field;
            case 'class': return SymbolKind.Class;
            case 'inductive': return SymbolKind.Struct;
            case 'instance': return SymbolKind.Constant;
            case 'def': return SymbolKind.Method;
            default: return SymbolKind.Function;
        }
    }

    async provideDocumentSymbols(document: TextDocument, token: CancellationToken): Promise<DocumentSymbol[]> {
        const response = await this.server.symbols(document.fileName);
        const infos : DocumentSymbol[] = [];

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

            stack[stack.length-1].kind = this.toSymbolKind(item.kind);
            stack[stack.length-1].detail = item.kind;
        }

        // An alternative approach that does not preserve order
        /*
        const infos_by_name : Map<string, DocumentSymbol> = new Map();
        const get_symbol = (s : string[], range: Range) : DocumentSymbol => {
            const s_key = JSON.stringify(s);
            const sym = infos_by_name.get(s_key);
            if (sym) {
                return sym;
            }
            const parent_s = s.slice();
            const this_name = parent_s.pop();
            const this_sym = new DocumentSymbol(this_name, null, SymbolKind.Namespace, range, range);
            infos_by_name.set(s_key, this_sym);
            if (parent_s.length > 0) {
                const parent = get_symbol(parent_s, range);
                parent.children.push(this_sym);
            }
            else {
                infos.push(this_sym);
            }
            return this_sym;
        };
        
        response.results
            .filter((item) => item.source && item.source.file &&
                item.source.line && item.source.column)
            .map((item) => {
                const pos = new CodePointPosition(item.source.line - 1, item.source.column).toPosition(document);
                const range = new Range(pos, pos);

                const sym = get_symbol(item.name_parts, range);
                sym.kind = this.toSymbolKind(item.kind)
            });
        */
        return infos;
    }
}
