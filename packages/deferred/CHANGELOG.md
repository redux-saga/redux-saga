# @redux-saga/deferred

## 1.2.1

### Patch Changes

- [#2324](https://github.com/redux-saga/redux-saga/pull/2324) [`2466c79`](https://github.com/redux-saga/redux-saga/commit/2466c798a5f56a5015e61c8fdf0ef8f2a6a852a4) Thanks [@neurosnap](https://github.com/neurosnap)! - Add LICENSE file

## 1.2.0

### Minor Changes

- [#2308](https://github.com/redux-saga/redux-saga/pull/2308) [`8207e33`](https://github.com/redux-saga/redux-saga/commit/8207e33) Thanks [@Andarist](https://github.com/Andarist), [@neurosnap](https://github.com/neurosnap)! - `exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

  This should fix the compatibility with Node.js ESM support.
