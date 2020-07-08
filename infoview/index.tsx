import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Main } from './main';
import { VSCodeInfoServer } from './extension';

const domContainer = document.querySelector('#infoview_root');
const server = new VSCodeInfoServer();
ReactDOM.render(<Main server={server}/>, domContainer);
