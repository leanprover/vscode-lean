/* Some svgs copied from vscode-codicons.

[note] soon this won't be needed hopefully: https://github.com/microsoft/vscode/issues/95199

[todo] Licence:
https://github.com/microsoft/vscode-codicons/blob/master/LICENSE

*/

import * as React from 'react';
import * as c2cimg from '../media/copy-to-comment-light.svg';

function Svg(props: {src: {attributes: {}; content: string}}) {
    const {src} = props;
    if (!src) {return null}
    const {attributes, content} = src;
    return <svg {...attributes} width="16" height="16" dangerouslySetInnerHTML={{__html: content}}/>
}

export function CopyToCommentIcon(): JSX.Element {
    return <Svg src={c2cimg}/>
}

export function PinIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M15.418 4.5l-.866-.375-1.459 1.46-4.016-.649a2.97 2.97 0 0 0-.94-1.322A2.893 2.893 0 0 0 6.65 3l-.498.498.055 3.818L.5 7.309l1.036 1.036h4.691l.041 3.355.518.518a2.71 2.71 0 0 0 2.36-1.868l4.002-.525 1.5 1.5.852-.348-.082-6.477zm-1.725 4.452l-.436-.15-4.514.6-.389.307a2.507 2.507 0 0 1-1.063 1.377V8.36l-.055-4.186c.513.335.9.831 1.098 1.411l.402.32 4.534.73.423-.136.784-.784.055 4.036-.839-.798z"/></svg>
}
export function PinnedIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M9.84 1l-.91.36V3.5L5.51 5.97a3.08 3.08 0 0 0-1.66-.28 3 3 0 0 0-1.54.64v.73l2.84 2.76L.96 14h1.52l3.44-3.44 2.49 2.43h.76a2.81 2.81 0 0 0 .36-3.1l2.55-3.32h2.2l.37-.88L9.84 1zm2 4.53l-.43.21-2.87 3.75-.06.51a2.6 2.6 0 0 1 .23 1.79l-2-2-.76-.74L3.6 6.76a2.85 2.85 0 0 1 1.84.23l.53-.06 3.86-2.79.21-.41V2.58l3 2.92-1.2.03z"/></svg>
}

export function PauseIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4.5 3H6v10H4.5V3zm7 0v10H10V3h1.5z"/></svg>
}

export function ContinueIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2.5 2H4v12H2.5V2zm3.5.18V14l9-5.938-9-5.881zm6.315 5.882L7.5 5v6.18l4.815-3.118z"/></svg>
}

export function RefreshIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M5.563 2.516A6.001 6.001 0 0 0 8 14 6 6 0 0 0 9.832 2.285l-.302.953A5.002 5.002 0 0 1 8 13a5 5 0 0 1-2.88-9.088l.443-1.396z"/><path fillRule="evenodd" clipRule="evenodd" d="M5 3H2V2h3.5l.5.5V6H5V3z"/></svg>
}

export function GoToFileIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M8.06 3.854L6 5.914 5.914 6l-.707-.707L6.5 4h-3a1.5 1.5 0 0 0 0 3H4v1h-.5a2.5 2.5 0 1 1 0-5h3L5.207 1.707 5.914 1l2.147 2.146v.708zM8.329 2H10v4h4v7H6V7.347L5 6.5v7l.5.5h9l.5-.5V5l-.1-.4-3.4-3.5-.3-.1H7.328l1 1zm5.575 3L11 2v3h2.903z"/></svg>
}

export function ClippyIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 13.992H4v-9h8v2h1v-2.5l-.5-.5H11v-1h-1a2 2 0 0 0-4 0H4.94v1H3.5l-.5.5v10l.5.5H7v-1zm0-11.2a1 1 0 0 1 .8-.8 1 1 0 0 1 .58.06.94.94 0 0 1 .45.36 1 1 0 1 1-1.75.94 1 1 0 0 1-.08-.56zm7.08 9.46L13 13.342v-5.35h-1v5.34l-1.08-1.08-.71.71 1.94 1.93h.71l1.93-1.93-.71-.71zm-5.92-4.16h.71l1.93 1.93-.71.71-1.08-1.08v5.34h-1v-5.35l-1.08 1.09-.71-.71 1.94-1.93z"/></svg>;
}

export function DoSuggestIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
     </svg>
}

export function DoNotSuggestIcon(): JSX.Element {
    return <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
        <path d="M 15.888 0.838 L 0.853 15.884 C 0.853 15.884 0.145 15.178 0.145 15.178 L 15.18 0.132 Z"/>
     </svg>
}

