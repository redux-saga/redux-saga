# @redux-saga/vite-plugin

Attaches source locations to sagas and effects so redux-saga can print saga stacks
(`The above error occurred in task ... src/sagas.js?12`). It is the successor to
`babel-plugin-redux-saga` and produces the same metadata, but it doesn't need Babel: it parses
with [oxc](https://oxc.rs) and edits the source in place, before TypeScript and JSX are stripped.

## Vite

```js
// vite.config.js
import reduxSaga from '@redux-saga/vite-plugin'

export default {
  plugins: [reduxSaga()],
}
```

By default it runs in the dev server and in non-production builds (Vitest included). Production
builds are left untouched.

## Other bundlers

The package is built on [unplugin](https://github.com/unjs/unplugin), so the same plugin is
available as `rollup`, `rolldown`, `webpack`, `rspack` and `esbuild` named exports:

```js
const { webpack: reduxSaga } = require('@redux-saga/vite-plugin')

module.exports = { plugins: [reduxSaga()] }
```

Outside Vite, the plugin runs when `NODE_ENV !== 'production'`.

## Options

| Option            | Default                           | Description                                              |
| ----------------- | --------------------------------- | -------------------------------------------------------- |
| `include`         | all JS/TS outside node_modules    | String (substring match) or RegExp, or an array of them. |
| `exclude`         | none                              | Same format as `include`.                                |
| `cwd`             | Vite `root`, else `process.cwd()` | Base directory for the reported file names.              |
| `useAbsolutePath` | `false`                           | Report absolute file names instead.                      |
| `enabled`         | see above                         | Force the plugin on or off.                              |

## Differences from babel-plugin-redux-saga

- Output keeps every source line in place, so no input source map handling is needed.
- Yielding the same object twice no longer throws "Cannot redefine property".
- `export default function* () {}` no longer crashes the transform (it's skipped, as there is no
  binding to attach to).
- Untranspiled anonymous generators show up as `anonymous` in saga stacks, where Babel's
  regenerator transform used to name them `_callee`.
