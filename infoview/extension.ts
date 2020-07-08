/* This file contains everything that is specific to the vscode extension
implementation of the infoview. So the idea is that lean-web-editor
shares the rest of this infoview directory with this project. */

import * as trythis from '../src/trythis';
export { trythis };

import * as c2cimg from '../media/copy-to-comment-light.svg';
export { c2cimg };

import { Server, Transport, Connection, Event, TransportError, Message } from 'lean-client-js-core';
import { ToInfoviewMessage, FromInfoviewMessage} from '../src/shared';
import { InfoServer } from './info_server';
import { Config, Location, PinnedLocation, ServerStatus, defaultConfig, locationEq } from '../src/shared';
export { Config, Location, PinnedLocation, defaultConfig, locationEq, ServerStatus};

class ProxyTransport implements Transport {
    connect(): Connection {
        return new ProxyConnectionClient(this.post);
    }
    constructor(readonly post: (msg: FromInfoviewMessage) => void) { }
}

/** Forwards all of the messages between extension and webview.
 * See also makeProxyTransport on the server.
 */
class ProxyConnectionClient implements Connection {
    error: Event<TransportError>;
    jsonMessage: Event<any>;
    alive: boolean;
    messageListener: (event: MessageEvent) => void;
    send(jsonMsg: any) {
        this.post({
            command: 'server_request',
            payload: JSON.stringify(jsonMsg),
        })
    }
    dispose() {
        this.jsonMessage.dispose();
        this.error.dispose();
        this.alive = false;
        window.removeEventListener('message', this.messageListener);
    }
    constructor(readonly post: (m: FromInfoviewMessage) => void) {
        this.alive = true;
        this.jsonMessage = new Event();
        this.error = new Event();
        this.messageListener = (event) => { // messages from the extension
            const message = event.data as ToInfoviewMessage; // The JSON data our extension sent
            // console.log('incoming:', message);
            switch (message.command) {
                case 'server_event': {
                    this.jsonMessage.fire(JSON.parse(message.payload));
                    break;
                }
                case 'server_error': {
                    this.error.fire(JSON.parse(message.payload));
                    break;
                }
            }
        };
        window.addEventListener('message', this.messageListener);
    }
}

declare const acquireVsCodeApi;
export class VSCodeInfoServer implements InfoServer {
    vscode = acquireVsCodeApi();
    lean: Server;
    currentConfig: Config = defaultConfig;
    currentAllMessages: Message[] = [];
    subscriptions: {dispose()}[] = []

    constructor() {
        this.lean = new Server(new ProxyTransport(this.post.bind(this)));
        this.lean.logMessagesToConsole = true;
        this.subscriptions.push(this.lean.allMessages.on(msgs => this.AllMessagesEvent.fire(msgs.msgs)));
        this.lean.connect();
        window.addEventListener('message', event => { // messages from the extension
            const message = event.data as ToInfoviewMessage; // The JSON data our extension sent
            switch (message.command) {
                case 'position': this.PositionEvent.fire(message.loc); break;
                case 'on_config_change':
                    this.currentConfig = { ...this.currentConfig, ...message.config };
                    this.ConfigEvent.fire(this.currentConfig);
                    break;
                case 'sync_pin': this.SyncPinEvent.fire(message); break;
                case 'pause': this.PauseEvent.fire(message); break;
                case 'continue': this.ContinueEvent.fire(message); break;
                case 'toggle_updating': this.ToggleUpdatingEvent.fire(message); break;
                case 'copy_to_comment': this.CopyToCommentEvent.fire(message); break;
                case 'toggle_pin': this.TogglePinEvent.fire(message); break;
                case 'restart': this.ServerRestartEvent.fire(message); break;
                case 'all_messages': this.AllMessagesEvent.fire(message.messages); break;
                case 'toggle_all_messages': this.ToggleAllMessagesEvent.fire({}); break;
                case 'server_event': break;
                case 'server_error': break;
            }
        });
        this.subscriptions.push(this.AllMessagesEvent.on(msgs => this.currentAllMessages = msgs));
        this.post({ command: 'request_config' });
    }
    post(message: FromInfoviewMessage): void { this.vscode.postMessage(message); }
    clearHighlight(): void { return this.post({ command: 'stop_hover' }); }
    highlightPosition(loc: Location): void { return this.post({ command: 'hover_position', loc }); }
    copyToComment(text: string): void { this.post({ command: 'insert_text', text: `/-\n${text}\n-/\n` }); }
    reveal(loc: Location): void { this.post({ command: 'reveal', loc }); }
    edit(loc: Location, text: string): void { this.post({ command: 'insert_text', loc, text }); }
    copyText(text: string): void { this.post({ command: 'copy_text', text }); }
    syncPin(pins: PinnedLocation[]) { this.post({ command: 'sync_pin', pins }); }

    SyncPinEvent: Event<{ pins: PinnedLocation[] }> = new Event();
    PauseEvent: Event<unknown> = new Event();
    ContinueEvent: Event<unknown> = new Event();
    ToggleUpdatingEvent: Event<unknown> = new Event();
    CopyToCommentEvent: Event<unknown> = new Event();
    TogglePinEvent: Event<unknown> = new Event();
    ServerRestartEvent: Event<unknown> = new Event();
    AllMessagesEvent: Event<Message[]> = new Event();
    ToggleAllMessagesEvent: Event<unknown> = new Event();
    PositionEvent: Event<Location> = new Event();
    ConfigEvent: Event<Config> = new Event();

    dispose() {
        for (const s of this.subscriptions) s.dispose();
    }
}