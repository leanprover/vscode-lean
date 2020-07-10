/* This file contains all of the types that are common to the extension and the infoview. */

import {  Message, Task } from 'lean-client-js-node';
import {Location, Config, PinnedLocation, InfoViewTacticStateFilter, locationEq} from '../infoview/types';
export {Location, Config, PinnedLocation, InfoViewTacticStateFilter, locationEq}

export interface InfoProps extends Location {
    widget?: string; // [note] vscode crashes if the widget is sent as a deeply nested json object.
    goalState?: string;

    location_name: string; // ${fileName}:${line}:${col}
    base_name: string;     // = basename(fileName)
}


/** The root state of the infoview */
export interface InfoViewState {
    cursorInfo: InfoProps;
    pinnedInfos: InfoProps[];
    config: Config;

    messages: Message[];
}

export interface InsertTextMessage {
    command: 'insert_text';
    /** If no location is given set to be the cursor position. */
    loc?: Location;
    text: string;
}
export interface RevealMessage {
    command: 'reveal';
    loc: Location;
}
export interface ServerRequestMessage {
    command: 'server_request';
    payload: string;
}
export interface HoverPositionMessage {
    command: 'hover_position';
    loc: Location;
    // uri: string; line: number; column: number; endLine: number; endColumn: number;
}

export interface SyncPinMessage {
    command: 'sync_pin';
    pins: PinnedLocation[];
}

/** Message from the infoview to the extension. */
export type FromInfoviewMessage =
    | ServerRequestMessage
    | InsertTextMessage
    | RevealMessage
    | HoverPositionMessage
    | {command: 'stop_hover'}
    | SyncPinMessage
    | {command: 'request_config'}
    | {command: 'copy_text'; text: string}

/** Message from the extension to the infoview. */
export type ToInfoviewMessage =
    | { command: 'server_event' | 'server_error'; payload: string} // payloads have to be stringified json because vscode crashes if the depth is too big. }
    | { command: 'position'; loc: Location}
    | { command: 'on_config_change'; config: Partial<Config>}
    | { command: 'all_messages'; messages: Message[]}
    | { command: 'toggle_all_messages' }
    | SyncPinMessage
    | { command: 'pause' | 'continue' | 'toggle_updating' | 'copy_to_comment' | 'toggle_pin' | 'restart'}