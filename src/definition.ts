import { Definition, DefinitionProvider, Location, Position, TextDocument, Uri } from 'vscode';
import { Server } from './server';
import { CodePointPosition } from './utils/utf16Position';

export class LeanDefinitionProvider implements DefinitionProvider {
    server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    async provideDefinition(document: TextDocument, position: Position): Promise<Definition> {
        const codePointPosition = CodePointPosition.ofPosition(document, position);
        const response = await this.server.info(document.fileName, codePointPosition.line + 1, codePointPosition.character);
        if (response.record && response.record.source) {
            const src = response.record.source;
            const uri = src.file ? Uri.file(src.file) : document.uri;
            const pos = new CodePointPosition(src.line - 1, src.column);
            return new Location(uri, pos.toPosition(document));
        } else {
            return null;
        }
    }
}
