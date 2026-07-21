# babel-plugin-redux-saga

## 1.2.1

### Patch Changes

- [#2757](https://github.com/redux-saga/redux-saga/pull/2757) [`f8a19db`](https://github.com/redux-saga/redux-saga/commit/f8a19db68a8b037a0e7ae7501fad548971d3cbbf) Thanks [@Zish19](https://github.com/Zish19)! - Fix crash when a saga yields a call expression that returns a primitive value. Location metadata is now attached through a single hoisted helper that guards `Object.defineProperty` against non-objects, so yielding numbers, strings, `null` or `undefined` no longer throws.

## 1.2.0

### Minor Changes

- [#2416](https://github.com/redux-saga/redux-saga/pull/2416) [`6707228`](https://github.com/redux-saga/redux-saga/commit/6707228c23c6cd8f54e4cde8d1fb1887c3831af1) Thanks [@Andarist](https://github.com/Andarist)! - `exports` field has been added to the `package.json` manifest. It limits what files can be imported from a package but we've tried our best to allow importing all the files that were considered to be a part of the public API.

## 1.1.3

### Patch Changes

- [#2324](https://github.com/redux-saga/redux-saga/pull/2324) [`2466c79`](https://github.com/redux-saga/redux-saga/commit/2466c798a5f56a5015e61c8fdf0ef8f2a6a852a4) Thanks [@neurosnap](https://github.com/neurosnap)! - Add LICENSE file
