# @redux-saga/types

## 1.3.1

### Patch Changes

- [#2714](https://github.com/redux-saga/redux-saga/pull/2714) [`1f10ddd`](https://github.com/redux-saga/redux-saga/commit/1f10ddd4452a0ad7813a7fcd82005377659db63d) Thanks [@Andarist](https://github.com/Andarist)! - Fixed TS types compatibility with `"moduleResolution": "node"`.

## 1.3.0

### Minor Changes

- [#2416](https://github.com/redux-saga/redux-saga/pull/2416) [`6707228`](https://github.com/redux-saga/redux-saga/commit/6707228c23c6cd8f54e4cde8d1fb1887c3831af1) Thanks [@Andarist](https://github.com/Andarist)! - `exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

## 1.2.1

### Patch Changes

- [#2324](https://github.com/redux-saga/redux-saga/pull/2324) [`2466c79`](https://github.com/redux-saga/redux-saga/commit/2466c798a5f56a5015e61c8fdf0ef8f2a6a852a4) Thanks [@neurosnap](https://github.com/neurosnap)! - Add LICENSE file

## 1.2.0

### Minor Changes

- [#2295](https://github.com/redux-saga/redux-saga/pull/2295) [`bed4458`](https://github.com/redux-saga/redux-saga/commit/bed4458a79f21fd568a9d970968c9c8b8cbe1bf4) Thanks [@lourd](https://github.com/lourd)! - Adds type inference for result of task returned from runSaga and SagaMiddleware.run

* [#2296](https://github.com/redux-saga/redux-saga/pull/2296) [`612cae8`](https://github.com/redux-saga/redux-saga/commit/612cae81f0b8e6eb01b0b4c9ed961906be1fea98) Thanks [@lourd](https://github.com/lourd)! - Updates Channel type to eliminate void-emitting pitfall

### Patch Changes

- [#2004](https://github.com/redux-saga/redux-saga/pull/2004) [`20f22a8`](https://github.com/redux-saga/redux-saga/commit/20f22a8edd3bc66c2373ad31fb2c81e9bfed435f) Thanks [@gilbsgilbs](https://github.com/gilbsgilbs)! - A generic type has been added to the `Task` interface and that should be preferred over using a generic parameter in `Task#result` and `Task#toPromise`.

* [#2270](https://github.com/redux-saga/redux-saga/pull/2270) [`d2579a2`](https://github.com/redux-saga/redux-saga/commit/d2579a204c6fa75105a74c999542dfc331697c21) Thanks [@Methuselah96](https://github.com/Methuselah96)! - Inlined Redux `Action` type to fix compatibility with strict package managers.
