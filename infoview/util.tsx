import * as React from 'react';
import { Event } from 'lean-client-js-core';

/** Split a string by a regex, executing `f_no_match` on the pieces which don't match, `f_match` on the pieces which do,
and concatenating the results into an array. */
export function regexMap<T>(regex: RegExp, s: string, f_no_match: (snm : string) => T, f_match: (m : RegExpExecArray) => T ) : T[] {
    // copy the regex to reset the position information
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
    if (final_non_match) out.push(f_no_match(final_non_match));
    return out;
}

export function colorizeMessage(goal: string): JSX.Element {
    // `replace(r, match)(cont)(s)` replaces `r` with `match` in `s`, and runs `cont` on
    // non-matches.
    const replace = <T,>(r: RegExp, match: (s : string) => T) =>
                        (cont: (s : string) => T[]) =>
                        (s : string) : T[] => {
        const results = regexMap<T[]>(r, s, cont, m => [match(m[1])]);
        return Array.prototype.concat(...results);
    }
    const pipeline = [
        replace(/^([|⊢]) /mg,                  x => <strong className="goal-vdash">{x}&nbsp;</strong>),
        replace(/^(\d+ goals|1 goal)/mg,       x => <strong className="goal-goals">{x}</strong>),
        replace(/^(context|state):/mg,         x => <><strong className="goal-goals">{x}</strong>:</>),
        replace(/^(case) /mg,                  x => <><strong className="goal-case">{x}</strong>&nbsp;</> ),
        replace(/^([^:\n< ][^:\n⊢{[(⦃]*) :/mg, x => <><strong className="goal-hyp">{x}</strong> :</>),
    ]
    let replacer = (s : string) => [<>{s}</>];
    for (const f of pipeline.reverse()) {
        replacer = f(replacer);
    }
    return <>{replacer(goal)}</>;
}

export function basename(path: string): string { return path.split(/[\\/]/).pop(); }

export function useEvent<T>(ev: Event<T>, f: (_: T) => void, dependencies?: React.DependencyList): void {
    React.useEffect(() => {
        const h = ev.on(f);
        return () => h.dispose();
    }, dependencies)
}
