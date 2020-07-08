import { Server, Message, Event } from 'lean-client-js-core';
import { Location, PinnedLocation, Config } from './extension';

/** a singleton class containing all of the information and events and triggers needed to render an infoview. */
export interface InfoServer {
    lean: Server;
    currentAllMessages: Message[];

    /** Call this to instruct the editor to remove all highlighting. */
    clearHighlight(): void;
    /** Call this to instruct the editor to highlight a specific piece of sourcefile. */
    highlightPosition(loc: Location): void;
    /** Call this to instruct the editor to copy the given text to a comment above the cursor. */
    copyToComment(text: string): void;
    /** Call this to instruct the editor to reveal the given location. */
    reveal(loc: Location): void;
    /** Call this to instruct the editor to insert the given text above the given location. */
    edit(loc: Location, text: string): void;
    /** Call this to instruct the editor to copy the given text to the clipboard. */
    copyText(text: string): void;
    /** Call this to tell the editor that the pins have updated.
     * This is needed because if the user inserts text above a pinned location,
     * the editor needs to recalculate the position of the pin, once this is done the
     * `SyncPinEvent` is fired with the new pin locations.
     */
    syncPin(pins: PinnedLocation[]): void;

    /** Triggered when the user inserts text and causes pin locations to change. */
    SyncPinEvent: Event<{pins: PinnedLocation[]}>;
    /** Fired when the user triggers a pause command (external to the infoview). */
    PauseEvent: Event<unknown>;
    /** Fired when the user triggers a continue command (external to the infoview). */
    ContinueEvent: Event<unknown>;
    /** Fired when the user triggers a toggle updating command (external to the infoview). */
    ToggleUpdatingEvent: Event<unknown>;
    /** Fired when the user triggers a copy to comment command (external to the infoview). */
    CopyToCommentEvent: Event<unknown>;
    /** Fired when the user triggers a toggle pin command (external to the infoview). */
    TogglePinEvent: Event<unknown>;
    /** Fired when the lean server restarts. */
    ServerRestartEvent: Event<unknown>;
    /** Fired when the user triggers a toggle all messages command (external to the infoview). */
    ToggleAllMessagesEvent: Event<unknown>;
    /** Triggered when messages change. */
    AllMessagesEvent: Event<Message[]>;
    /** Triggers whenever the config is changed. */
    ConfigEvent: Event<Config>;
    /** Fired whenever the user changes their cursor position in the source file. */
    PositionEvent: Event<Location>;

    dispose();
}