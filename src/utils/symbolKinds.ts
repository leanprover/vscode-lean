import { CompletionItemKind, SymbolKind } from 'vscode';
import { SymbolKind as LeanSymbolKind } from 'lean-client-js-core';

/** Convert from the lean "kinds" o the closest applicable {@link SymbolKind} */
export function toSymbolKind (s?: LeanSymbolKind): SymbolKind {
    switch (s) {
        case undefined: return SymbolKind.Function;  // for older lean servers
        case 'meta': return SymbolKind.Event;
        case 'class': return SymbolKind.Interface;
        case 'definition': return SymbolKind.Field;
        case 'inductive': return SymbolKind.Enum;
        case 'instance': return SymbolKind.Constant;
        case 'structure': return SymbolKind.Class;
        case 'theorem': return SymbolKind.Function;
        default: return SymbolKind.Object;
    }
}

export function toCompletionItemKind (s?: LeanSymbolKind): CompletionItemKind {
    switch (s) {
        case undefined: return CompletionItemKind.Function;  // for older lean servers
        case 'meta': return CompletionItemKind.Event;
        case 'class': return CompletionItemKind.Interface;
        case 'definition': return CompletionItemKind.Field;
        case 'inductive': return CompletionItemKind.Enum;
        case 'instance': return CompletionItemKind.Constant;
        case 'structure': return CompletionItemKind.Class;
        case 'theorem': return CompletionItemKind.Function;
        default: return CompletionItemKind.Value;
    }
}
