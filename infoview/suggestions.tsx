import * as React from 'react';
import { WidgetIdentifier } from 'lean-client-js-core';
import { SuggestionsInfoStatus, SuggestionsInt, SuggestionsModelResult, SuggestionsTacticInfo } from '../src/shared';
import { useEvent} from './util';
import { SuggestionsEvent, SuggestionsErrorEvent, post } from './server';

const statusColTable: { [T in SuggestionsInfoStatus]: string } = {
    'loading': 'gold',
    'error': 'dark-red',
    'valid': 'green',
    'solving': 'blue',
    'done': ''
}
interface SuggestionsProps {
    widget: WidgetIdentifier;
    goalState: string;
}

function SingleTacticInfo(props: { tacticInfo: SuggestionsTacticInfo, widget: WidgetIdentifier}): JSX.Element {
    return (
        <a className={'font-code link pointer mh2 glow easeTransition ' + statusColTable.done} style={{whiteSpace: 'pre-wrap'}} key={`${props.tacticInfo.tactic}`}
            onClick={
                e => {
                    e.preventDefault();
                    post({
                        command: 'insert_text',
                        text: `${props.tacticInfo.tactic},`,
                        insert_type: 'relative'
                    })
                }}
        >
            {props.tacticInfo.tactic}
        </a>
    )
}


function Waiter(): JSX.Element {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        const interval = setInterval(() => setCount((count + 1) % 4), 500);
        return () => clearInterval(interval);
    }, [count]);
    return <span>{'.'.repeat(count)}</span>;
}

function Suggestions(props: {
    goalState: string, reqId: number, widget: WidgetIdentifier
}) {
    const [status, setStatus] = React.useState<SuggestionsInfoStatus>('loading');
    const [errorMsg, setErrorMsg] = React.useState<string>();
    const [suggestionsResults, setSuggestionsResults] = React.useState<SuggestionsModelResult>();

    // get Suggestions results - set Suggestions results
    useEvent(
        SuggestionsEvent,
        (suggestions: SuggestionsInt) => {
            if (suggestions.results && props.reqId === suggestions.reqId) {
                if (suggestions.results.error) {
                    setErrorMsg(suggestions.results.error);
                    setStatus('error');
                } else {
                    setSuggestionsResults(suggestions.results);
                    setStatus('done');
                }
            }
        },
        [props.reqId]
    );

    React.useEffect(() => {
        setStatus('loading');
        setErrorMsg(undefined); // reset error msg
    }, [props.reqId]);

    return (
        <div>
            <p>
                <span className={'easeTransition ml2 b-ns ' + statusColTable[status]}>Suggestions</span>
            </p>
            <div>
                {['loading', 'error'].includes(status) ?
                    <p className={'easeTransition ml3 ' + statusColTable[status]}>
                        {status === 'loading' ? 'Querying Suggestions' : 'Something went wrong :('}
                        {status === 'loading'? <Waiter />: null}
                    </p>
                : null}
                {errorMsg ? <i className={'easeTransition ml3 ' + statusColTable[status]}>{errorMsg}</i> : null}
                {(['done', 'checking'].includes(status) && suggestionsResults && !suggestionsResults.error && suggestionsResults.tactic_infos) ?
                    <div>{Object.values(suggestionsResults.tactic_infos).map(
                        tactic_info => <div><SingleTacticInfo key={tactic_info.tactic} tacticInfo={tactic_info} widget={props.widget}/><br/></div>
                    )}</div>
                    : null
                }
            </div>
        </div>
    );
}

export function Suggestor(props: SuggestionsProps): JSX.Element {
    const [suggReqId, setSuggReqId] = React.useState(0);
    const [doSuggest, setDoSuggest] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string>();
    const [prefix, setPrefix] = React.useState('');

    useEvent(
        SuggestionsErrorEvent,
        (s) => {
            setErrorMsg(s.error);
        }, []
    );

    React.useEffect(() => {
        setDoSuggest(true);
    }, [prefix, props.goalState])
    React.useEffect(() => {
        if (doSuggest) setDoSuggest(false);
        else return;
        if (props.goalState !== undefined && props.goalState !== 'no goals') {
            setSuggReqId(rid => {
                post({
                    command: 'get_suggestions',
                    reqId: rid + 1,
                    goalState: props.goalState,
                    prefix
                });
                setErrorMsg(undefined); // reset error msg
                return rid + 1
            });
        }
    }, [prefix, props.goalState, doSuggest])

    const inputProps = { style: { display: 'inline' }, type: 'text', size: 12, value: prefix };

    return (
        <div>
            <details open={true}>
                <summary className={'mv2'}>
                    Suggestions
                </summary>
                {errorMsg
                    ? <i className={'easeTransition mv2 ' + statusColTable.error}>{errorMsg}</i>
                    : <div>
                        <form className='ml2' onSubmit={(e) => e.preventDefault()}>
                            <span>Tactic prefix: </span>
                            <input {...inputProps} onChange={(e) => setPrefix(e.target.value)} />
                        </form>
                        <Suggestions widget={props.widget} goalState={props.goalState} reqId={suggReqId}/>
                      </div>
                }
            </details>
        </div>
    );
}