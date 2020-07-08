import { ServerStatus, Location, Config, defaultConfig, PinnedLocation, locationEq } from './extension';
import * as React from 'react';
import { Message } from 'lean-client-js-core';
import { Info } from './info';
import { Messages, processMessages, ProcessedMessage } from './messages';
import { Details } from './collapsing';
import { useEvent } from './util';
import { ContinueIcon, PauseIcon } from './svg_icons';
import './tachyons.css' // stylesheet assumed by Lean widgets. See https://tachyons.io/ for documentation
import './index.css'
import { InfoServer } from './info_server';

export const InfoServerContext = React.createContext<InfoServer>(null);
export const ConfigContext = React.createContext<Config>(null);
export const AllMessagesContext = React.createContext<Message[]>([]);
export const LocationContext = React.createContext<Location | null>(null);

function StatusView(props: ServerStatus) {
    return <Details>
        <summary className="mv2 pointer">Tasks</summary>
        <p>Running: {props.isRunning}</p>
        <table> <tbody>
            <tr key="header"><th>File Name</th>
                <th>Pos start</th>
                <th>Pos end</th>
                <th>Desc</th></tr>
            {props.tasks.map(t => <tr key={`${t.file_name}:${t.pos_col}:${t.pos_line}:${t.desc}`}>
                <td>{t.file_name}</td>
                <td>{t.pos_line}:{t.pos_col}</td>
                <td>{t.end_pos_line}:{t.end_pos_col}</td>
                <td>{t.desc}</td>
            </tr>)}
        </tbody>
        </table>
    </Details>
}

interface InfoViewProps {
    server: InfoServer;
    loc?: Location;
    config: Config;
}

export function InfoView(props: InfoViewProps) {
    if (!props || !props.server) { return null; }
    const {server, config, loc} = props;

    const [messages, setMessages] = React.useState<Message[]>([]);
    useEvent(server.AllMessagesEvent, (msgs) => setMessages(msgs));
    useEvent(server.ServerRestartEvent, _ => setMessages([]));

    if (!loc) return <p>Click somewhere in the Lean file to enable the info view.</p>;
    const allMessages = processMessages(messages.filter((m) => loc && m.file_name === loc.file_name));
    return <InfoServerContext.Provider value={server}>
        <ConfigContext.Provider value={config}>
            <div className="ma1">
                <Infos curLoc={loc} />
                <div className="mv2"><AllMessages allMessages={allMessages} /></div>
            </div>
        </ConfigContext.Provider>
    </InfoServerContext.Provider>;
}

interface InfosProps {
    curLoc: Location;
}

function Infos(props: InfosProps): JSX.Element {
    const { curLoc } = props;
    const server = React.useContext(InfoServerContext);
    useEvent(server.SyncPinEvent, (syncMsg) => setPinnedLocs(syncMsg.pins), []);
    useEvent(server.TogglePinEvent, () => isPinned(curLoc) ? unpin()() : pin());
    const [pinnedLocs, setPinnedLocs] = React.useState<PinnedLocation[]>([]);
    const isPinned = (loc: Location) => pinnedLocs.some((l) => locationEq(l, loc));
    const pinKey = React.useRef<number>(0);
    const pin = () => {
        if (isPinned(curLoc)) { return; }
        pinKey.current += 1;
        const pins = [...pinnedLocs, { ...curLoc, key: pinKey.current }];
        setPinnedLocs(pins);
        server.syncPin(pins);
    }
    const unpin = (key?: number) => () => {
        if (key === undefined) {
            const pinned = pinnedLocs.find(p => locationEq(p, curLoc));
            if (pinned) {
                key = pinned.key;
            } else {
                return;
            }
        }
        const pins = pinnedLocs.filter((l) => l.key !== key);
        setPinnedLocs(pins);
        server.syncPin(pins);
    }
    return <>
        <div>
            {pinnedLocs.map((loc) =>
                <Info key={loc.key} loc={loc} isPinned={true} isCursor={false} onPin={unpin(loc.key)} />)}
        </div>
        <Info loc={curLoc} isPinned={false} isCursor={true} onPin={pin} />
    </>;
}

function usePaused<T>(isPaused: boolean, t: T): T {
    const old = React.useRef<T>(t);
    if (!isPaused) old.current = t;
    return old.current;
}

function AllMessages({ allMessages: allMessages0 }: { allMessages: ProcessedMessage[] }): JSX.Element {
    const config = React.useContext(ConfigContext);
    const server = React.useContext(InfoServerContext);
    const [isPaused, setPaused] = React.useState<boolean>(false);
    const allMessages = usePaused(isPaused, allMessages0);
    const setOpenRef = React.useRef<React.Dispatch<React.SetStateAction<boolean>>>();
    useEvent(server.ToggleAllMessagesEvent, () => setOpenRef.current((t) => !t));
    return <Details setOpenRef={setOpenRef} initiallyOpen={!config.infoViewAutoOpenShowGoal}>
        <summary>
            All Messages ({allMessages.length})
            <span className="fr">
                <a className="link pointer mh2 dim"
                    onClick={e => { e.preventDefault(); setPaused(!isPaused) }}
                    title={isPaused ? 'continue updating' : 'pause updating'}>
                    {isPaused ? <ContinueIcon /> : <PauseIcon />}
                </a>
            </span>
        </summary>
        <div className="ml1"> <Messages messages={allMessages} /> </div>
    </Details>;
}
