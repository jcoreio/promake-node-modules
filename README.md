# promake-node-modules

[![CircleCI](https://circleci.com/gh/jcoreio/promake-yarn.svg?style=svg)](https://circleci.com/gh/jcoreio/promake-yarn)
[![Coverage Status](https://codecov.io/gh/jcoreio/promake-yarn/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/promake-yarn)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/promake-yarn.svg)](https://badge.fury.io/js/promake-yarn)

Promake rule for installing node_modules only when necessary

# Usage

```
npm install --save promake-node-modules
```

## Example in Promake script

```js
#!/usr/bin/env node
// @flow

const Promake = require('promake')
const fs = require('fs-extra')
const nodeModulesRule = require('promake-node-modules')

const promake = new Promake()

const rule = nodeModulesRule({
  promake,
  projectDir: 'path/to/project', // defaults to process.cwd(),
  command: 'yarn', // defaults to npm
})

promake.task('deps', [rule])

promake.cli()
```

## `nodeModulesRule(options)`

Creates a promake `HashRule` for installing `node_modules`. The hash is stored in `node_modules/.cache/promake-node-modules.md5`.

### Arguments

#### `options.promake` (`Promake`, **required**)

The instance of `Promake` to add the rule to.

#### `options.projectDir` (`string`, _optional_, default: `process.cwd()`)

The path to the project directory to install `node_modules` in.

#### `command` (`string`, _optional_, default: `'npm'`)

The command to run to install `node_modules`.

#### `args` (`string[]`, _optional_, default: `['install']`)

The arguments for the install `command`.

#### `additionalFiles` (`string[]`, _optional_)

Additional files to include in the hash. You can put lockfiles in here, but be aware that
if you run a command that updates the lockfile, it will cause this rule to run again (since
the previous hash won't match).
