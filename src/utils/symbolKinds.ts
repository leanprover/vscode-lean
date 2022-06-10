import { CompletionItemKind, SymbolKind } from 'vscode';
import { SymbolKind as LeanSymbolKind } from 'lean-client-js-core';

/** Convert from the lean "kinds" o the closest applicable {@link SymbolKind} */
export function toSymbolKind (s?: LeanSymbolKind): SymbolKind {
    switch (s) {
        case 'axiom': return SymbolKind.Event;
        case 'const': return SymbolKind.Event;
        case 'class': return SymbolKind.Interface;
        case 'constructor': return SymbolKind.Constructor;
        case 'field': return SymbolKind.Field;
        case 'inductive': return SymbolKind.Class;
        case 'instance': return SymbolKind.Constant;
        case 'definition': return SymbolKind.Field;
        case 'theorem': return SymbolKind.Function;
        default: return SymbolKind.Object;
    }
}

export function toCompletionItemKind (s?: LeanSymbolKind): CompletionItemKind {
    switch (s) {
        case 'axiom': return CompletionItemKind.Event;
        case 'const': return CompletionItemKind.Event;
        case 'class': return CompletionItemKind.Interface;
        case 'constructor': return CompletionItemKind.Constructor;
        case 'field': return CompletionItemKind.Field;
        case 'inductive': return CompletionItemKind.Class;
        case 'instance': return CompletionItemKind.Constant;
        case 'definition': return CompletionItemKind.Method;
        case 'theorem': return CompletionItemKind.Function;
        default: return CompletionItemKind.Value;
    }
}