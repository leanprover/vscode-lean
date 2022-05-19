import { CancellationToken, Location, Position, ProviderResult, SymbolInformation, SymbolKind, Uri, workspace, WorkspaceSymbolProvider } from 'vscode';
import { Server } from './server';
import { CodePointPosition } from './utils/utf16Position';

export class LeanWorkspaceSymbolProvider implements WorkspaceSymbolProvider {
    constructor(private server: Server) {}

    async provideWorkspaceSymbols(query: string): Promise<SymbolInformation[]> {
        const response = await this.server.search(query);
        return await Promise.all(response.results
            .filter((item) => item.source && item.source.file &&
                item.source.line && item.source.column)
            .map(async (item) => {
                const document = await workspace.openTextDocument(Uri.file(item.source.file));
                const loc = new Location(Uri.file(item.source.file),
                    new CodePointPosition(item.source.line - 1, item.source.column).toPosition(document));
                return new SymbolInformation(item.text, SymbolKind.Function, item.type, loc);
            }));
    }
}
