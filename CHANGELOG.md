## Changes from v0.16.0 to v1.0.0
During work on v1, we made several breaking changes

### Breaking changes
- errors thrown during put execution are no longer caught and swallowed, you need to catch them manually
- errors thrown during cancellation process are no longer swallowed, you need to keep `finally` block fail-safe
- removed some deprecated APIs - `takeEvery`, `takeLatest`, `throttle` from the redux-saga entry point (they are and were importable from `redux-saga/effects`). `put.sync` and `takem` were removed.
- removing execution of an array of effects `yield [...]`. use `all` effect instead.
- `delay` became an effect, old `delay` function (not effect!) can be imported from `@redux-saga/delay-p`
- `put.resolve` was changed to `putResolve`
- `take.maybe` was changed to `takeMaybe`
- changed API of runSaga - it no longer accepts subscribe option, you should create a channel (preferably stdChannel), pass it as channel argument to the runSaga API and communicate with through it with `take` and `put` methods
- `task.done` getter was changed to be `task.toPromise` method
- `onError` doesn't extend `error` with additional field `sagaStack`, but pass it as a property of second argument. before: `onError: (e: Error)`, after: `onError(e: Error, { sagaStack })`
- `Effect` shape, yielded to redux-saga middleware, is stabilized and declared now as a plain JavaScript object
- channels private getters (__takers__ and __closed__) got removed
- `{effects, utils}` aren't imported from 'redux-saga' anymore. imports them from `redux-saga/effects`, `redux-saga/utils`
- `is` helper should be imported from `@redux-saga/is`.
- `createMockTask`, `cloneableGenerator` should be imported from `@redux-saga/testing-utils`
- now `race` should be finished if any of effects resolved with `END` (by analogy with all)
- cancel and join cannot receive variadic arguments anymore. so you have to rewrite `cancel(...[tasks])` and `join(...[tasks])` to `cancel([tasks])` and `join([tasks])` respectively. also calling `cancel(...)` returns a cancel-effect (before it may return an `all` effect), and calling `join(...)` returns a join-effect.
- refactor effect structure from `{[IO]: true, [type]: payload }` to `{ [IO]: true, type, payload }` to get rid of dynamic `type` property. Could affect you if implement custom monitor for saga effects.
- channel and actionChannel have default buffer of buffers.expanding()
- eventChannel does no longer accept matcher argument.
- exported util of `arrayOfDeffered` got renamed to the correct `arrayOfDeferred`

### New functionality
- multicastChannel - no buffering, notify all pending takers, multicastChannel#take(cb, matcher = matchers.wildcard)
- support for `yield take(multicastChannel, pattern)`
- internal stdChannel got reworked to be a singleton object (it is wrapped multicastChannel's instance'), also it is an exported API to support new runSaga's signature - this should also result in being a small perf boost
- `effectMiddlewares` - useful especially for testing, you can intercept/hijack any effect and resolve it on your own - passing it very redux-style to the next middleware (last being redux-saga itself). How it might be used can be checked here. Many thanks to @eloytoro for this feature
- `takeLeading` helper. It takes "leading" action and ignores all incoming ones of the same type while the "leading" is still handled (useful for things debouncing)
- `retry` helper. Receives a function and executes it (with blocking call). In case of failure will try to make another call after `delayLength` milliseconds, if a number of attempts < `maxTries` parameter
- add `debounce` helper. Spawns a `saga` on an action dispatched to the Store that matches `pattern`. Saga will be called after it stops taking `pattern` actions for `ms` milliseconds. Purpose of this is to prevent calling saga until the actions are settled off.
