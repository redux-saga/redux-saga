# @redux-saga/delay-p

## 1.2.0

### Minor Changes

- [#2308](https://github.com/redux-saga/redux-saga/pull/2308) [`8207e33`](https://github.com/redux-saga/redux-saga/commit/8207e33) Thanks [@Andarist](https://github.com/Andarist), [@neurosnap](https://github.com/neurosnap)! - `exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

  This should fix the compatibility with Node.js ESM support.

### Patch Changes

- [#2293](https://github.com/redux-saga/redux-saga/pull/2293) [`2d2214e`](https://github.com/redux-saga/redux-saga/commit/2d2214e9ca8949892c0a7a23ceef39fa32d13939) Thanks [@neurosnap](https://github.com/neurosnap)! - Fixed an issue with arguments that exceed the maximum value for the internally-used `setTimeout`. Previously it could overflow based on the input that was too big and thus a timeout could resolve immediately.
