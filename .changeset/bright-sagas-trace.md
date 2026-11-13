---
'@redux-saga/unplugin': major
---

First release of `@redux-saga/unplugin`, the successor to `babel-plugin-redux-saga`. It attaches the same source-location metadata to sagas and yielded effects, so saga stacks show file names and line numbers, without needing Babel: it parses with oxc and edits the source in place, before TypeScript and JSX are stripped.

One plugin covers Vite, Rollup, Rolldown, webpack, Rspack and esbuild, each from its own import path (`@redux-saga/unplugin/vite`, `@redux-saga/unplugin/webpack`, ...). It runs in development and leaves production builds untouched by default, following Vite's `isProduction`, webpack/Rspack's `mode`, or `NODE_ENV` elsewhere. Requires Node 22.12 or later.

Compared to the Babel plugin it also wraps optional calls (`yield api?.fetch()`), conditional yields (`yield cond ? call(a) : call(b)`) and calls behind TypeScript assertions (`yield call(fn) as Effect`), keeps the inferred name of generator function expressions (`const saga = function* () {}`), never throws when a yielded value is frozen or was already yielded, and no longer crashes on `export default function* () {}`.
