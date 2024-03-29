import { Position, TextDocument } from 'vscode';

/**
 * The lean server reports positions as unicode codepoints, which matches what the VSCode editor
 * shows to the user; but VSCode's API (and the javascript runtime) measures things in UTF16 code
 * _units_ internally. This class converts between the two.
 *
 * We implement this using `...str` to split code units into codepoints.
 *
 * Note that this does not deal with the lean server starting its line numbers at 1 and not zero.
 */
export class CodePointPosition {
    constructor(
        /**
         * The zero-based line value.
         */
        readonly line: number,
        /**
         * The zero-based character value, in unicode codepoints (not javascript UTF16 codewords!)
         */
        readonly character: number) {}

    toPosition (t : TextDocument) : Position {
        const lineStr = t.lineAt(new Position(this.line, 0)).text;
        const fixedCol = [...lineStr].slice(0, this.character).join('').length;
        return new Position(this.line, fixedCol);
    }

    static ofPosition (t: TextDocument, p: Position) : CodePointPosition {
        const lineStr = t.lineAt(p).text.slice(0, p.character);
        return new CodePointPosition(p.line, [...lineStr].length);
    }
}

