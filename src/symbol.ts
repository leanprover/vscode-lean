import { SymbolResponse } from 'lean-client-js-core';
import { CancellationToken, Definition, DefinitionProvider, DocumentSymbol, DocumentSymbolProvider, Location, Position, ProviderResult, SymbolInformation, SymbolKind, TextDocument, Uri, workspace } from 'vscode';
import { Server } from './server';
import { CodePointPosition } from './utils/utf16Position';

export class LeanDocumentSymbolProvider implements DocumentSymbolProvider {
    server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    async provideDocumentSymbols(document: TextDocument, token: CancellationToken): Promise<SymbolInformation[]> {
        const response = await this.server.symbols(document.fileName);
        return response.results
            .filter((item) => item.source && item.source.file &&
                item.source.line && item.source.column)
            .map((item) => {
                const loc = new Location(Uri.file(item.source.file),
                    new CodePointPosition(item.source.line - 1, item.source.column).toPosition(document));
                return new SymbolInformation(item.name, SymbolKind.Function, null, loc);
            });
    }
}
