# @redux-saga/unplugin

Adds file names and line numbers to redux-saga's saga stacks. It attaches source-location
metadata to your sagas and the effects they yield, which redux-saga reads when an error bubbles up
to the root saga.

It is the successor to [`babel-plugin-redux-saga`](https://github.com/redux-saga/redux-saga/tree/main/packages/babel-plugin-redux-saga) and produces the
same metadata, but doesn't need Babel: it parses with [oxc](https://oxc.rs) and edits the source in
place, before TypeScript and JSX are stripped. One package covers Vite, Rollup, Rolldown, webpack,
Rspack and esbuild.

## Example

Saga stack without the plugin:

```
The above error occurred in task throwAnErrorSaga
    created by errorInCallAsyncSaga
    created by takeEvery(ACTION_ERROR_IN_CALL_ASYNC, errorInCallAsyncSaga)
    created by rootSaga
```

With the plugin:

```
The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16
    created by errorInCallAsyncSaga  src/sagas/index.js?25
    created by takeEvery(ACTION_ERROR_IN_CALL_ASYNC, errorInCallAsyncSaga)
    created by rootSaga  src/sagas/index.js?78
```

The stack is passed to the `onError` middleware option as `sagaStack` (see
[Troubleshooting](https://redux-saga.js.org/docs/Troubleshooting#error-stack-for-errors-bubbling-to-root-saga-is-unreadable)).

## Install

```sh
npm i --save-dev @redux-saga/unplugin
```

Requires Node 22.12 or later.

## Usage

Each bundler has its own import path. For a complete Vite app, see the
[error-demo example](https://github.com/redux-saga/redux-saga/tree/main/examples/error-demo).

### Vite (and Vitest)

```js
// vite.config.js
import reduxSaga from '@redux-saga/unplugin/vite'

export default {
  plugins: [reduxSaga()],
}
```

Vitest uses your Vite config, so tests get saga stacks too.

### Rollup / Rolldown

```js
// rollup.config.js
import reduxSaga from '@redux-saga/unplugin/rollup' // or '@redux-saga/unplugin/rolldown'

export default {
  plugins: [reduxSaga()],
}
```

Put it before plugins that compile TypeScript or JSX, so it sees your original code.

### webpack / Rspack

Requires webpack 5 or Rspack 1.

```js
// webpack.config.mjs
import reduxSaga from '@redux-saga/unplugin/webpack' // or '@redux-saga/unplugin/rspack'

export default {
  plugins: [reduxSaga()],
}
```

In a CommonJS config, the plugin is the `default` export:

```js
// webpack.config.js
const reduxSaga = require('@redux-saga/unplugin/webpack').default

module.exports = {
  plugins: [reduxSaga()],
}
```

### esbuild

```js
import { build } from 'esbuild'
import reduxSaga from '@redux-saga/unplugin/esbuild'

await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  plugins: [reduxSaga()],
})
```

### When it runs

The metadata is meant for development, so by default:

- **Vite**: the plugin runs unless Vite considers the build production (`isProduction`). The dev
  server and Vitest are instrumented, `vite build` is not, whatever its `--mode`. To instrument a
  build, run it with `NODE_ENV=development vite build`.
- **webpack / Rspack**: the plugin runs when `mode` is `development` or `none`. With no `mode`
  set, both bundlers build for production, so the plugin stays off.
- **Other bundlers**: the plugin runs when `NODE_ENV !== 'production'`.

Use the `enabled` option to override this.

## Options

All options are optional.

| Option            | Default                                                                   | Description                                                                                                       |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `include`         | every `.js/.jsx/.ts/.tsx/.mjs/.cjs/.mts/.cts` file outside `node_modules` | String (matched as a substring of the file path, with `/` separators on every OS) or RegExp, or an array of them. |
| `exclude`         | none                                                                      | Same format as `include`.                                                                                         |
| `cwd`             | Vite's `root`, webpack/Rspack's `context`, else `process.cwd()`           | Directory file names are reported relative to.                                                                    |
| `useAbsolutePath` | `false`                                                                   | Report absolute file names instead of relative ones.                                                              |
| `enabled`         | see [When it runs](#when-it-runs)                                         | Force the plugin on or off.                                                                                       |

## How it transforms your code

Source:

```js
// src/sagas/index.js
function* saga1() {
  yield call(foo, 1, 2, 3)
}

function* saga2() {
  yield 2
}
```

Result (formatted for reading; the real output keeps every statement on its original line):

```js
function* saga1() {
  yield _extendSagaSourceLocation(call(foo, 1, 2, 3), {
    fileName: 'src/sagas/index.js',
    lineNumber: 3,
    code: 'call(foo, 1, 2, 3)',
  })
}
_extendSagaSourceLocation(saga1, { fileName: 'src/sagas/index.js', lineNumber: 2, code: null })

function* saga2() {
  yield 2
}
_extendSagaSourceLocation(saga2, { fileName: 'src/sagas/index.js', lineNumber: 6, code: null })

function _extendSagaSourceLocation(value, location) {
  // attaches `location` to objects and functions as '@@redux-saga/LOCATION';
  // primitives and values that can't take the property are returned untouched
}
```

What gets a location:

- generator function declarations and expressions (not object or class methods);
- the value of `yield` when it is a call (`call(fn)`, `api?.fetch()`), a logical expression
  (`cond && call(fn)`), or a conditional with a call in either branch (`cond ? call(a) : call(b)`),
  including behind TypeScript assertions (`call(fn) as Effect`).

`yield*` and other yielded values are left alone. The plugin also emits a source map, so your
devtools keep showing the original code.

`.js` files may contain JSX, and files that aren't explicitly ES modules may be CommonJS. Files the
plugin can't parse, such as Flow-annotated code, are left untouched with a warning; add them to
`exclude` to silence it.

## Migrating from babel-plugin-redux-saga

1. Remove `babel-plugin-redux-saga` from your Babel config and dependencies.
2. Add `@redux-saga/unplugin` to your bundler config as shown above. The `useAbsolutePath` option
   works the same way.

Differences you may notice:

- Conditional yields (`yield cond ? call(a) : call(b)`) now get a location.
- Optional calls (`yield api?.fetch()`) and calls behind TypeScript assertions
  (`yield call(fn) as Effect`, `satisfies`, `!`) now get a location.
- Yielding the same object twice no longer throws "Cannot redefine property".
- `export default function* () {}` no longer crashes the transform. It gets no location, as it has
  no name to attach one to.
- Generator function expressions keep the name JavaScript gives them (`const saga = function* () {}`
  is still `saga` in saga stacks). Truly anonymous ones, like `call(function* () {})`, show up as
  `anonymous` when they aren't transpiled to ES5; Babel's regenerator transform used to name them
  `_callee`.
- Yielding a frozen or sealed object (immer or RTK state, for example) no longer throws.
- The plugin switches itself off in production builds (see [When it runs](#when-it-runs)), so it
  no longer needs to be limited to a development `env` in your config.

React Native isn't supported: Metro only runs Babel plugins, and `babel-plugin-redux-saga` doesn't
work on React Native either ([#1831](https://github.com/redux-saga/redux-saga/issues/1831)).
