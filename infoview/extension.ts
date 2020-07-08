/* This file contains everything that is specific to the vscode extension
implementation of the infoview. So the idea is that lean-web-editor
shares the rest of this infoview directory with this project. */

import * as trythis from '../src/trythis';
export { trythis };

import * as c2cimg from '../media/copy-to-comment-light.svg';
export { c2cimg };

export { Config, Location, PinnedLocation, ServerStatus, defaultConfig, locationEq } from '../src/shared';
