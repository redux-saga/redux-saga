# @redux-saga/core

## 1.2.3

### Patch Changes

- [#2372](https://github.com/redux-saga/redux-saga/pull/2372) [`2cccf48`](https://github.com/redux-saga/redux-saga/commit/2cccf480a8ef67680daf319893a690f0cb74ef9e) Thanks [@neurosnap](https://github.com/neurosnap)! - Added a `channel` property to the `SagaMiddlewareOptions` to reflect its runtime support.

## 1.2.2

### Patch Changes

- [#2340](https://github.com/redux-saga/redux-saga/pull/2340) [`345b828`](https://github.com/redux-saga/redux-saga/commit/345b828c721a95258a7fdfde0408fbb94de83f80) Thanks [@neurosnap](https://github.com/neurosnap)! - throttle now accepts a channel as originally intended

## 1.2.1

### Patch Changes

- [#2324](https://github.com/redux-saga/redux-saga/pull/2324) [`2466c79`](https://github.com/redux-saga/redux-saga/commit/2466c798a5f56a5015e61c8fdf0ef8f2a6a852a4) Thanks [@neurosnap](https://github.com/neurosnap)! - Add LICENSE file

- Updated dependencies [[`2466c79`](https://github.com/redux-saga/redux-saga/commit/2466c798a5f56a5015e61c8fdf0ef8f2a6a852a4)]:
  - @redux-saga/deferred@1.2.1
  - @redux-saga/delay-p@1.2.1
  - @redux-saga/is@1.1.3
  - @redux-saga/symbols@1.1.3
  - @redux-saga/types@1.2.1

## 1.2.0

### Minor Changes

- [#2295](https://github.com/redux-saga/redux-saga/pull/2295) [`bed4458`](https://github.com/redux-saga/redux-saga/commit/bed4458a79f21fd568a9d970968c9c8b8cbe1bf4) Thanks [@lourd](https://github.com/lourd)! - Adds type inference for result of task returned from runSaga and SagaMiddleware.run

* [#2296](https://github.com/redux-saga/redux-saga/pull/2296) [`612cae8`](https://github.com/redux-saga/redux-saga/commit/612cae81f0b8e6eb01b0b4c9ed961906be1fea98) Thanks [@lourd](https://github.com/lourd)! - Updates Channel type to eliminate void-emitting pitfall

- [#2308](https://github.com/redux-saga/redux-saga/pull/2308) [`8207e33`](https://github.com/redux-saga/redux-saga/commit/8207e33) Thanks [@Andarist](https://github.com/Andarist), [@neurosnap](https://github.com/neurosnap)! - `exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

  This should fix the compatibility with Node.js ESM support.

### Patch Changes

- [#2261](https://github.com/redux-saga/redux-saga/pull/2261) [`5ae6578`](https://github.com/redux-saga/redux-saga/commit/5ae657844ce7d18153ddf7c3deb14c2c7ed81088) Thanks [@neurosnap](https://github.com/neurosnap)! - Require `CpsCallback` in all functions passed to the `cps` effect creator. This fixes a regression caused by TS 4.0 changing the behavior around spreading `never` into tuple types

* [#2004](https://github.com/redux-saga/redux-saga/pull/2004) [`20f22a8`](https://github.com/redux-saga/redux-saga/commit/20f22a8edd3bc66c2373ad31fb2c81e9bfed435f) Thanks [@gilbsgilbs](https://github.com/gilbsgilbs)! - A generic type has been added to the `Task` interface and that should be preferred over using a generic parameter in `Task#result` and `Task#toPromise`.

- [#2068](https://github.com/redux-saga/redux-saga/pull/2068) [`586179c`](https://github.com/redux-saga/redux-saga/commit/586179c1b6183e320161d79d3709aa7f7ca2dde3) Thanks [@mikabytes](https://github.com/mikabytes)! - Added warnings when using `take(channelOrPattern)` incorrectly with more than one parameter. It helps to surface problem with `take(ACTION_A, ACTION_B)` being used instead of `take([ACTION_A, ACTION_B])`.

- Updated dependencies [[`bed4458`](https://github.com/redux-saga/redux-saga/commit/bed4458a79f21fd568a9d970968c9c8b8cbe1bf4), [`612cae8`](https://github.com/redux-saga/redux-saga/commit/612cae81f0b8e6eb01b0b4c9ed961906be1fea98), [`979b8b4`](https://github.com/redux-saga/redux-saga/commit/979b8b446f42e79a45c517b826cbddb89af8a54e), [`20f22a8`](https://github.com/redux-saga/redux-saga/commit/20f22a8edd3bc66c2373ad31fb2c81e9bfed435f), [`d2579a2`](https://github.com/redux-saga/redux-saga/commit/d2579a204c6fa75105a74c999542dfc331697c21), [`2d2214e`](https://github.com/redux-saga/redux-saga/commit/2d2214e9ca8949892c0a7a23ceef39fa32d13939)]:
  - @redux-saga/types@1.2.0
  - @redux-saga/deferred@1.2.0
  - @redux-saga/delay-p@1.2.0
