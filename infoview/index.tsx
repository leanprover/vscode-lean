import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InfoView } from './main';
import { VSCodeInfoServer } from './vscode_info_server';
import { useEvent } from './util';
import { defaultConfig, Location } from './extension';

const domContainer = document.querySelector('#infoview_root');
const server = new VSCodeInfoServer();

function Main() {
    const [config, setConfig] = React.useState(defaultConfig);
    useEvent(server.ConfigEvent, (cfg) => setConfig(cfg), []);

    const [curLoc, setCurLoc] = React.useState<Location>(null);
    useEvent(server.PositionEvent, (loc) => setCurLoc(loc), []);

    return <InfoView server={server} loc={curLoc} config={config}/>
}

ReactDOM.render(<Main/>, domContainer);
