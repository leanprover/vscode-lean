import * as React from 'react';
import { LocationContext, ConfigContext, InfoServerContext } from './main';
import { Widget } from './widget';
import { Goal } from './goal';
import { Messages, processMessages, ProcessedMessage, GetMessagesFor } from './messages';
import { basename, useEvent } from './util';
import { CopyToCommentIcon, PinnedIcon, PinIcon, ContinueIcon, PauseIcon, RefreshIcon, GoToFileIcon } from './svg_icons';
import { Details } from './collapsing';
import { Event, InfoResponse, CurrentTasksResponse, Message } from 'lean-client-js-core';
import { Location } from './types';

/** Older versions of Lean can't deal with multiple simul info requests so this just prevents that. */
class OneAtATimeDispatcher {
    inflight = 0;
    head: Promise<any> = new Promise((r) => r({}));
    constructor () {}
    run<T>(tb: () => Promise<T>): Promise<T> {
        if (this.inflight === 0) {
            this.inflight++;
            this.head = tb().finally(() => {this.inflight--;});
            return this.head;
        } else {
            this.inflight++;
            this.head = this.head
                .catch(() => ({}))
                .then(() => tb().finally(() => {this.inflight--;}));
            return this.head;
        }
    }
}
const global_dispatcher = new OneAtATimeDispatcher();

type InfoStatus = 'updating' | 'error' | 'pinned' | 'cursor' | 'loading';

const statusColTable: {[T in InfoStatus]: string} = {
    'updating': '',
    'loading': 'gold',
    'cursor': '',
    'pinned': '',
    'error': 'dark-red',
}

interface InfoProps {
    loc: Location;
    isPinned?: boolean; // defaults to false
    isCursor?: boolean; // defaults to true
    /** If undefined then the pin icon will not appear and we assume pinning feature is disabled */
    onPin?: (new_pin_state: boolean) => void;
}

function isLoading(ts: CurrentTasksResponse, l: Location): boolean {
    return l &&
        ts.tasks.some(t => t.file_name === l.file_name && t.pos_line < l.line && l.line < t.end_pos_line);
}

function isDone(ts: CurrentTasksResponse) {
    return ts.tasks.length === 0;
}

function useMappedEvent<T, S>(ev: Event<T>, initial: S, f: (_: T) => S, deps?: React.DependencyList): S {
    const [s, setS] = React.useState<S>(initial);
    useEvent(ev, (t) => setS(f(t)), deps);
    return s;
}

// returns function that triggers `cb`
// - but only ms milliseconds after the first call
// - and not more often than once every ms milliseconds
function delayedThrottled(ms: number, cb: () => void): () => void {
    const waiting = React.useRef<boolean>(false);
    const callbackRef = React.useRef<() => void>();
    callbackRef.current = cb;
    return () => {
        if (!waiting.current) {
            waiting.current = true;
            setTimeout(() => {
                waiting.current = false;
                callbackRef.current();
            }, ms);
        }
    };
}

interface InfoState {
    loc: Location;
    loading: boolean;
    response?: InfoResponse;
    messages: ProcessedMessage[];
    error?: string;
    triggerUpdate: () => void;
}

function infoState(isPaused: boolean, loc: Location): InfoState {
    const server = React.useContext(InfoServerContext);
    const loading = useMappedEvent(server.lean.tasks, false, (t) => isLoading(t, loc), [loc]);

    const [response, setResponse] = React.useState<InfoResponse>();
    const [error, setError] = React.useState<string>();
    const triggerUpdate = delayedThrottled(loading ? 500 : 200, async () => {
        if (isPaused) return;
        if (!loc) {
            setResponse(null);
            setError(null);
            return;
        }
        try {
            const info = await global_dispatcher.run(() => server.lean.info(loc.file_name, loc.line, loc.column));
            const widget = info.record && info.record.widget;
            if (widget && widget.line === undefined) {
                widget.line = loc.line;
                widget.column = loc.column;
            }
            if (!loading) {
                setResponse(info);
            } else {
                triggerUpdate();
            }
            setError(null);
        } catch (err) {
            setError('' + err);
            setResponse(null);
            if (err === 'interrupted') {
                triggerUpdate();
            }
        }
    });

    const tasksFinished = useMappedEvent(server.lean.tasks, true, (t) => isDone(t) ? new Object() : false);
    React.useEffect(() => triggerUpdate(), [loc, isPaused, tasksFinished]);
    useEvent(server.ServerRestartEvent, triggerUpdate);
    useEvent(server.lean.error, triggerUpdate);

    const config = React.useContext(ConfigContext);
    const [messages, setMessages] = React.useState<ProcessedMessage[]>([]);
    const updateMsgs = (msgs: Message[]) => {
        setMessages(loc ? processMessages(GetMessagesFor(msgs, loc, config)) : []);
    };
    React.useEffect(() => updateMsgs(server.currentAllMessages), []);
    useEvent(server.AllMessagesEvent, updateMsgs, [loc, config]);

    return { loc, loading, response, error, messages, triggerUpdate };
}

export function Info(props: InfoProps): JSX.Element {
    const server = React.useContext(InfoServerContext);
    const isCursor = props.isCursor ?? true;
    const isPinned = props.isPinned ?? false;
    const onPin = props.onPin;

    const [isPaused, setPaused] = React.useState<boolean>(false);
    const isCurrentlyPaused = React.useRef<boolean>();
    isCurrentlyPaused.current = isPaused;

    const stateRef = React.useRef<InfoState>({loc: null, loading: true, messages: [], triggerUpdate: () => {}});
    const newState = infoState(isPaused, (isPaused && stateRef.current.loc) || props.loc);
    if (!isPaused) stateRef.current = newState;
    const {loc, response: info, error, loading, messages} = stateRef.current;

    function copyGoalToComment() {
        const goal = info.record && info.record.state;
        if (goal) server.copyToComment(goal);
    }

    // If we are the cursor infoview, then we should subscribe to
    // some commands from the extension
    useEvent(server.CopyToCommentEvent, () => isCursor && copyGoalToComment(), [isCursor, info]);
    useEvent(server.PauseEvent, () => isCursor && setPaused(true), [isCursor]);
    useEvent(server.ContinueEvent, () => isCursor && setPaused(false), [isCursor]);
    useEvent(server.ToggleUpdatingEvent, () => isCursor && setPaused(!isCurrentlyPaused.current), [isCursor]);

    const [displayMode, setDisplayMode] = React.useState<'widget' | 'text'>('widget');
    const widgetModeSwitcher =
        <select value={displayMode} onChange={(ev) => setDisplayMode(ev.target.value as any)}>
            <option value={'widget'}>widget</option>
            <option value={'text'}>plain text</option>
        </select>;

    const goalState = info && info.record && info.record.state;
    const widget = info && info.record && info.record.widget;
    const status: InfoStatus = loading ? 'loading' : error ? 'error' : isPinned ? 'pinned' : 'cursor';
    const statusColor = statusColTable[status];
    const nothingToShow = !widget && !goalState && messages.length === 0;
    const locationString = loc && `${basename(loc.file_name)}:${(loc).line}:${(loc).column}`;

    // TODO: updating of paused views
    const forceUpdate = () => !isCurrentlyPaused.current && stateRef.current.triggerUpdate();

    return <LocationContext.Provider value={loc}>
        <Details initiallyOpen>
            <summary style={{transition: 'color 0.5s ease'}} className={'mv2 ' + statusColor}>
                {locationString}
                {isPinned && !isPaused && ' (pinned)'}
                {!isPinned && isPaused && ' (paused)'}
                {isPinned && isPaused && ' (pinned and paused)'}
                <span className="fr">
                    {goalState && <a className="link pointer mh2 dim" title="copy state to comment" onClick={e => {e.preventDefault(); copyGoalToComment()}}><CopyToCommentIcon/></a>}
                    {isPinned && <a className={'link pointer mh2 dim '} onClick={e => { e.preventDefault(); server.reveal(loc); }} title="reveal file location"><GoToFileIcon/></a>}
                    {onPin && <a className="link pointer mh2 dim" onClick={e => { e.preventDefault(); onPin(!isPinned)}} title={isPinned ? 'unpin' : 'pin'}>{isPinned ? <PinnedIcon/> : <PinIcon/>}</a>}
                    <a className="link pointer mh2 dim" onClick={e => { e.preventDefault(); setPaused(!isPaused)}} title={isPaused ? 'continue updating' : 'pause updating'}>{isPaused ? <ContinueIcon/> : <PauseIcon/>}</a>
                    { !isPaused && <a className={'link pointer mh2 dim'} onClick={e => { e.preventDefault(); forceUpdate(); }} title="update"><RefreshIcon/></a> }
                </span>
            </summary>
            <div className="ml1">
                <div>
                    {!loading && error &&
                        <div className="error">
                            Error updating: {'' + error}.
                            <a className="link pointer dim" onClick={e => forceUpdate()}>Try again.</a>
                        </div> }
                </div>
                <div>
                    { (widget || goalState) &&
                        <Details initiallyOpen>
                            <summary>
                                Tactic state
                                { widget && <span className='fr'>{widgetModeSwitcher}</span> }
                            </summary>
                            <div className='ml1'>
                                { widget && displayMode === 'widget' ?
                                    <Widget widget={widget} fileName={loc.file_name} /> :
                                    <Goal goalState={goalState} /> }
                            </div>
                        </Details> }
                </div>
                <div>
                    { messages.length > 0 &&
                        <Details initiallyOpen>
                            <summary className="mv2 pointer">Messages ({messages.length})</summary>
                            <div className="ml1">
                                <Messages messages={messages}/>
                            </div>
                        </Details> }
                </div>
                {nothingToShow && (
                    loading ? 'Loading...' :
                    isPaused ? <span>Updating is paused. <a className="link pointer dim" onClick={e => forceUpdate()}>Refresh</a> or <a className="link pointer dim" onClick={e => setPaused(false)}>resume updating</a> to see information</span> :
                    'No info found.')}
            </div>
        </Details>
    </LocationContext.Provider>;
}

