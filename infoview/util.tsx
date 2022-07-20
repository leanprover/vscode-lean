import * as React from 'react';
import { Event } from 'lean-client-js-core';

// https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/// Split a string by a regex, executing `f_no_match` on the pieces which don't match, `f_match` on the pieces which do,
/// and concatenating the results into an array.
export function regexMap<T>(regex: RegExp, s: string, f_no_match: (snm : string) => T, f_match: (m : RegExpExecArray) => T ) : T[] {
    const r = new RegExp(regex);
    const out = [];
    let lastIdx = r.lastIndex;
    let match = null;
    while ((match = r.exec(s)) !== null) {
        const not_matched = s.slice(lastIdx, match.index);
        if (not_matched) out.push(f_no_match(not_matched));
        out.push(f_match(match));
        lastIdx = r.lastIndex;
        if (!r.global) break;
    }
    const final_non_match = s.slice(lastIdx);
    if (final_non_match) out.push(final_non_match);
    return out;
}

export function colorizeMessage(goal: string): string {
    return goal
        .replace(/^([|⊢]) /mg, '<strong class="goal-vdash">$1</strong> ')
        .replace(/^(\d+ goals|1 goal)/mg, '<strong class="goal-goals">$1</strong>')
        .replace(/^(context|state):/mg, '<strong class="goal-goals">$1</strong>:')
        .replace(/^(case) /mg, '<strong class="goal-case">$1</strong> ')
        .replace(/^([^:\n< ][^:\n⊢{[(⦃]*) :/mg, '<strong class="goal-hyp">$1</strong> :');
}

export function basename(path: string): string { return path.split(/[\\/]/).pop(); }

export function useEvent<T>(ev: Event<T>, f: (_: T) => void, dependencies?: React.DependencyList): void {
    React.useEffect(() => {
        const h = ev.on(f);
        return () => h.dispose();
    }, dependencies)
}
