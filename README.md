udemy-dl 2.0
========

# Install
>npm i -g udemy-dl

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/udemy-dl.svg)](https://npmjs.org/package/udemy-dl)
[![Downloads/week](https://img.shields.io/npm/dw/udemy-dl.svg)](https://npmjs.org/package/udemy-dl)
[![License](https://img.shields.io/npm/l/udemy-dl.svg)](https://github.com/riazXrazor/udemy-dl/blob/master/package.json)

![udemy-dl usage](https://raw.githubusercontent.com/riazXrazor/udemy-dl/master/assets/udemy-dl.gif)

<!-- toc -->
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g udemy-dl
$ udl COMMAND
running command...
$ udl (-v|--version|version)
udemy-dl/2.0.7 win32-x64 node-v10.16.3
$ udl --help [COMMAND]
USAGE
  $ udl COMMAND
...
```
<!-- usagestop -->
```sh-session
$ npm install -g udemy-dl
$ udl COMMAND
running command...
$ udl (-v|--version|version)
udemy-dl/2.0.0 win32-x64 node-v10.16.3
$ udl --help [COMMAND]
USAGE
  $ udl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`udl help [COMMAND]`](#udl-help-command)
* [`udl login`](#udl-login)
* [`udl reset`](#udl-reset)
* [`udl update`](#udl-update)

## `udl help [COMMAND]`

display help for udl

```
USAGE
  $ udl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src\commands\help.ts)_

## `udl login`

>Login to udemy.com and displays a list of courses to download.

```
USAGE
  $ udl login

OPTIONS
  -b, --business=business  Business name, in case of Udemy for Business
  -e, --export             Export the course data as json with links
  -o, --output=output      Output directory where the videos will be save, defaults to current directory
  -p, --password=password  Udemy password
  -r, --url=url            Url of the couse to be downloaded
  -u, --username=username  Udemy username

DESCRIPTION
  >Login to udemy.com and displays a list of courses to download.
```

_See code: [src\commands\login.js](https://github.com/riazXrazor/udemy-dl/blob/v2.0.7/src\commands\login.js)_

## `udl reset`

>Erase all login credentials stored and download progress.

```
USAGE
  $ udl reset

OPTIONS
  -d, --downloadOnly  Erase downloading progress only
  -l, --loginOnly     Erase login credentials only

DESCRIPTION
  >Erase all login credentials stored and download progress.
```

_See code: [src\commands\reset.js](https://github.com/riazXrazor/udemy-dl/blob/v2.0.7/src\commands\reset.js)_

## `udl update`

>Update udemy-dl to latest version

```
USAGE
  $ udl update

DESCRIPTION
  >Update udemy-dl to latest version
```

_See code: [src\commands\update.js](https://github.com/riazXrazor/udemy-dl/blob/v2.0.7/src\commands\update.js)_
<!-- commandsstop -->
* [`udl help [COMMAND]`](#udl-help-command)
* [`udl login`](#udl-login)
* [`udl reset`](#udl-reset)
* [`udl update [CHANNEL]`](#udl-update-channel)

## `udl help [COMMAND]`

display help for udl

```
USAGE
  $ udl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src\commands\help.ts)_

## `udl login`

>Login to udemy.com and displays a list of courses to download.

```
USAGE
  $ udl login

OPTIONS
  -e, --export             export the course data as json with links
  -o, --output=output      output directory where the videos will be save, defaults to current directory
  -p, --password=password  udemy password
  -r, --url=url            url of the couse to be downloaded
  -u, --username=username  udemy username

DESCRIPTION
  >Login to udemy.com and displays a list of courses to download.
```

_See code: [src\commands\login.js](https://github.com/riazXrazor/udemy-dl/blob/v2.0.0/src\commands\login.js)_

## `udl reset`

>Erase all login credentials stored and download progress.

```
USAGE
  $ udl reset

OPTIONS
  -d, --downloadOnly  Erase downloading progress only
  -l, --loginOnly     Erase login credentials only

DESCRIPTION
  >Erase all login credentials stored and download progress.
```

_See code: [src\commands\reset.js](https://github.com/riazXrazor/udemy-dl/blob/v2.0.0/src\commands\reset.js)_

## `udl update [CHANNEL]`

update the udl CLI

```
USAGE
  $ udl update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.9/src\commands\update.ts)_
<!-- commandsstop -->
