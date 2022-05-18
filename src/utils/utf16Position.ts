import { Position, TextDocument } from 'vscode';

// The server reports positions as unicode codepoints, but VSCode's API (and the javascript
// runtime) measures things in UTF16 code _units_. It turns out that `...str` in javascript
// splits a string into its codepoints, which is precisely what we want to count.
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
        let lineStr = t.lineAt(new Position(this.line, 0)).text;
        let fixedCol = [...lineStr].slice(0, this.character).join("").length;
        return new Position(this.line, fixedCol);
    }

    public static ofPosition (t: TextDocument, p: Position) : CodePointPosition {
        let lineStr = t.lineAt(p).text.slice(0, p.character);
        return new CodePointPosition(p.line, [...lineStr].length);
    }
}

