# Lean for VSCode

This extension adds support for [Lean](https://github.com/leanprover/lean).

## Features

We currently support a variety of features.

* Incremental compilation and checking via the Lean server
* Hover shows documentation, types, and Unicode input help.
* Auto-completion based on context and type via the Lean server
* Error messages / diagnostics
* Unicode input support
* Info view window to show goal and error messages ("Lean: Open Info View")
* Batch file execution
* Search for declarations in open files (ctrl+p #)
* Region of interest checking (i.e control over how much of the project we check)
* Fill in `{! !}` holes using ctrl+.

<!--\!\[feature X\]\(images/feature-x.png\)-->

## Requirements

This extension requires an installation of [Lean](https://leanprover.github.io).

## Extension Settings

This extension contributes the following settings:

* `lean.executablePath`: controls which Lean executable is used when starting the server
* `lean.timeLimit`: controls the `-T` flag passed to the Lean executable
* `lean.memoryLimit`: controls the `-M` flag passed to the Lean executable
* `lean.roiModeDefault`: controls the default region of interest, the options are:
  - `nothing`: check nothing
  - `visible`: check only visible files
  - `open`: check all open files
  - `project`: check the entire project's files

### Other potentially helpful settings

* Fonts with good unicode support (on Linux): `"editor.fontFamily": "Source Code Pro Medium, DejaVu Sans Mono"`
* By default, vscode will complete `then` to `has_bind.and_then` when you press enter.  To disable this behavior, set `"editor.acceptSuggestionOnEnter": false`
* If you like colored brackets, try out [Bracket Pair Colorizer](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer).

## Development

* Install `npm` (and for Ubuntu 17.04 `nodejs-legacy`)
* Install `code` from http://code.visualstudio.com
* Run `git clone https://github.com/leanprover/vscode-lean`
* Run `npm install` in the `vscode-lean` directory
* Open the `vscode-lean` in vscode and start developing (F5 starts the debugger)

## Release Notes

### 0.10.0 (unreleased)

### 0.9.0
* Only show commands acting on Lean files when a Lean file is open in the current editor
* Hole support

### 0.8.0
* Info view showing the current goal and error messages.
* Search command (ctrl+p #)
* Improved unicode input.

### 0.7.2
* New input mode for Unicode symbols.
* Internally uses new client library to interact with the Lean server.

### 0.7.1
* Fixes issue with highlighting commands beginning with `#`.

### 0.7.0
* Support for controlling the "region of interest", i.e which files
  are considered by the Lean server for checking and recompilation.
* Miscellaneous improvements to the grammar, and syntax highlighting
* Initial support for recording Lean server errors, and an option
  for displaying them upon crash.
* Support for more bracket pairs including many unicode options.
* Properly set working directory when executing in batch mode.
* Configuration for controlling default region of interest.

### 0.6.6

* Use `semver` for detecting and comparing versions.
* Fix issue where diagnostics were not cleared on
  server restart.

### 0.6.5

Add support for detecting Lean server versions.

### 0.6.4

Add support for time and memory limits.

### 0.6.2

Consider angle brackets and parenthesis when completing unicode symbols.

### 0.6.0

Bug fixes, stability, and a handful of feature improvements

### 0.4.0

Implement many features implemented by the EMACS mode. We now support:

- Hovering over names for type information
- Go-to-definition & peeking for constants
- Goal support, with the ability to display the
  goal at the current position.
- Basic auto-completion support
- Diagnostics support, displaying errors, information
   & warnings.

### 0.3.0

Add basic integration with the Lean server.

### 0.1.0

Initial release of the package.

-----------------------------------------------------------------------------------------------------------

## Contact

Please report issues on [Github](https://github.com/leanprover/vscode-lean), for questions or concerns you can email the
Lean mailing list, or send @jroesch mail directly.
