# API Reference

* [`Middleware API`](#middleware-api)
  * [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)
  * [`middleware.run(saga, ...args)`](#middlewarerunsaga-args)
* [`Effect creators`](#effect-creators)
  * [`take(pattern)`](#takepattern)
  * [`takeMaybe(pattern)`](#takemaybepattern)
  * [`take(channel)`](#takechannel)
  * [`takeMaybe(channel)`](#takemaybechannel)
  * [`takeEvery(pattern, saga, ...args)`](#takeeverypattern-saga-args)
  * [`takeEvery(channel, saga, ...args)`](#takeeverychannel-saga-args)
  * [`takeLatest(pattern, saga, ..args)`](#takelatestpattern-saga-args)
  * [`takeLatest(channel, saga, ..args)`](#takelatestchannel-saga-args)
  * [`takeLeading(pattern, saga, ..args)`](#takeleadingpattern-saga-args)
  * [`takeLeading(channel, saga, ..args)`](#takeleadingchannel-saga-args)
  * [`put(action)`](#putaction)
  * [`putResolve(action)`](#putresolveaction)
  * [`put(channel, action)`](#putchannel-action)
  * [`call(fn, ...args)`](#callfn-args)
  * [`call([context, fn], ...args)`](#callcontext-fn-args)
  * [`call([context, fnName], ...args)`](#callcontext-fnname-args)
  * [`call({context, fn}, ...args)`](#callcontext-fn-args-1)
  * [`apply(context, fn, args)`](#applycontext-fn-args)
  * [`cps(fn, ...args)`](#cpsfn-args)
  * [`cps([context, fn], ...args)`](#cpscontext-fn-args)
  * [`cps({context, fn}, ...args)`](#cpscontext-fn-args-1)
  * [`fork(fn, ...args)`](#forkfn-args)
  * [`fork([context, fn], ...args)`](#forkcontext-fn-args)
  * [`fork({context, fn}, ...args)`](#forkcontext-fn-args-1)
  * [`spawn(fn, ...args)`](#spawnfn-args)
  * [`spawn([context, fn], ...args)`](#spawncontext-fn-args)
  * [`join(task)`](#jointask)
  * [`join([...tasks])`](#jointasks)
  * [`cancel(task)`](#canceltask)
  * [`cancel([...tasks])`](#canceltasks)
  * [`cancel()`](#cancel)
  * [`select(selector, ...args)`](#selectselector-args)
  * [`actionChannel(pattern, [buffer])`](#actionchannelpattern-buffer)
  * [`flush(channel)`](#flushchannel)
  * [`cancelled()`](#cancelled)
  * [`setContext(props)`](#setcontextprops)
  * [`getContext(prop)`](#getcontextprop)
  * [`delay(ms, [val])`](#delayms-val)
  * [`throttle(ms, pattern, saga, ..args)`](#throttlems-pattern-saga-args)
  * [`throttle(ms, channel, saga, ..args)`](#throttlems-channel-saga-args)
  * [`debounce(ms, pattern, saga, ..args)`](#debouncems-pattern-saga-args)
  * [`debounce(ms, channel, saga, ..args)`](#debouncems-channel-saga-args)
  * [`retry(maxTries, delay, fn, ...args)`](#retrymaxtries-delay-fn-args)
* [`Effect combinators`](#effect-combinators)
  * [`race(effects)`](#raceeffects)
  * [`race([...effects])`](#raceeffects-with-array)
  * [`all([...effects]) (aka parallel effects)`](#alleffects---parallel-effects)
  * [`all(effects)`](#alleffects)
* [`Interfaces`](#interfaces)
  * [`Task`](#task)
  * [`Channel`](#channel)
  * [`Buffer`](#buffer)
  * [`SagaMonitor`](#sagamonitor)
* [`External API`](#external-api)
  * [`runSaga(options, saga, ...args)`](#runsagaoptions-saga-args)
* [`Utils`](#utils)
  * [`channel([buffer])`](#channelbuffer)
  * [`eventChannel(subscribe, [buffer])`](#eventchannelsubscribe-buffer)
  * [`buffers`](#buffers)
  * [`cloneableGenerator(generatorFunc)`](#cloneablegeneratorgeneratorfunc)
  * [`createMockTask()`](#createmocktask)


# Cheatsheets

* [Blocking / Non-blocking](#blocking--non-blocking)

## Middleware API

### `createSagaMiddleware(options)`

Creates a Redux middleware and connects the Sagas to the Redux Store

- `options: Object` - A list of options to pass to the middleware. Currently supported options are:
  - `context: Object` - initial value of the saga's context.

  - `sagaMonitor` : [SagaMonitor](#sagamonitor) - If a Saga Monitor is provided, the middleware will deliver monitoring events to the monitor.

  - `onError: (error: Error, { sagaStack: string })` - if provided, the middleware will call it with uncaught errors from Sagas. useful for sending uncaught exceptions to error tracking services.
  - `effectMiddlewares` : Function [] - allows you to intercept any effect, resolve it on your own and pass to the next middleware. See [this section](/docs/advanced/Testing.md#effectmiddlwares) for a detailed example


#### Example

Below we will create a function `configureStore` which will enhance the Store with a new method `runSaga`. Then in our main module, we will use the method to start the root Saga of the application.

**configureStore.js**
```javascript
import createSagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  const sagaMiddleware = createSagaMiddleware()
  return {
    ...createStore(reducer, initialState, applyMiddleware(/* other middleware, */sagaMiddleware)),
    runSaga: sagaMiddleware.run
  }
}
```

**main.js**
```javascript
import configureStore from './configureStore'
import rootSaga from './sagas'
// ... other imports

const store = configureStore()
store.runSaga(rootSaga)
```

#### Notes

See below for more information on the `sagaMiddleware.run` method.

### `middleware.run(saga, ...args)`

Dynamically run `saga`. Can be used to run Sagas **only after** the `applyMiddleware` phase.

- `saga: Function`: a Generator function
- `args: Array<any>`: arguments to be provided to `saga`

The method returns a [Task descriptor](#task-descriptor).

#### Notes

`saga` must be a function which returns a [Generator Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator). The middleware will then iterate over the Generator and execute all yielded Effects.

`saga` may also start other sagas using the various Effects provided by the library. The iteration process described below is also applied to all child sagas.

In the first iteration, the middleware invokes the `next()` method to retrieve the next Effect. The middleware then executes the yielded Effect as specified by the Effects API below. Meanwhile, the Generator will be suspended until the effect execution terminates. Upon receiving the result of the execution, the middleware calls `next(result)` on the Generator passing it the retrieved result as an argument. This process is repeated until the Generator terminates normally or by throwing some error.

If the execution results in an error (as specified by each Effect creator) then the `throw(error)` method of the Generator is called instead. If the Generator function defines a `try/catch` surrounding the current yield instruction, then the `catch` block will be invoked by the underlying Generator runtime. The runtime will also invoke any corresponding finally block.

In the case a Saga is cancelled (either manually or using the provided Effects), the middleware will invoke `return()` method of the Generator. This will cause the Generator to skip directly to the finally block.

## Effect creators

> Notes:

> - Each function below returns a plain JavaScript object and does not perform any execution.
> - The execution is performed by the middleware during the Iteration process described above.
> - The middleware examines each Effect description and performs the appropriate action.

### `take(pattern)`

Creates an Effect description that instructs the middleware to wait for a specified action on the Store.
The Generator is suspended until an action that matches `pattern` is dispatched.

The result of `yield take(pattern)` is an action object being dispatched.

`pattern` is interpreted using the following rules:

- If `take` is called with no arguments or `'*'` all dispatched actions are matched (e.g. `take()` will match all actions)

- If it is a function, the action is matched if `pattern(action)` is true (e.g. `take(action => action.entities)` will match all actions having a (truthy) `entities` field.)
> Note: if the pattern function has `toString` defined on it, `action.type` will be tested against `pattern.toString()` instead. This is useful if you're using an action creator library like redux-act or redux-actions.

- If it is a String, the action is matched if `action.type === pattern` (e.g. `take(INCREMENT_ASYNC)`

- If it is an array, each item in the array is matched with aforementioned rules, so the mixed array of strings and function predicates is supported. The most common use case is an array of strings though, so that `action.type` is matched against all items in the array (e.g. `take([INCREMENT, DECREMENT])` and that would match either actions of type `INCREMENT` or `DECREMENT`).

The middleware provides a special action `END`. If you dispatch the END action, then all Sagas blocked on a take Effect will be terminated regardless of the specified pattern. If the terminated Saga has still some forked tasks which are still running, it will wait for all the child tasks to terminate before terminating the Task.

### `takeMaybe(pattern)`

Same as `take(pattern)` but does not automatically terminate the Saga on an `END` action. Instead all Sagas blocked on a take Effect will get the `END` object.

#### Notes

`takeMaybe` got its name from the FP analogy - it's like instead of having a return type of `ACTION` (with automatic handling) we can have a type of `Maybe(ACTION)` so we can handle both cases:

- case when there is a `Just(ACTION)` (we have an action)
- the case of `NOTHING` (channel was closed*). i.e. we need some way to map over `END`

* internally all `dispatch`ed actions are going through the `stdChannel` which is getting closed when `dispatch(END)` happens

### `take(channel)`

Creates an Effect description that instructs the middleware to wait for a specified message from the provided Channel. If the channel is already closed, then the Generator will immediately terminate following the same process described above for `take(pattern)`.

### `takeMaybe(channel)`

Same as `take(channel)` but does not automatically terminate the Saga on an `END` action. Instead all Sagas blocked on a take Effect will get the `END` object. See more [here](#takemaybepattern)

### `takeEvery(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeEvery` will add the incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a basic task `fetchUser`. We use `takeEvery` to start a new `fetchUser` task on each dispatched `USER_REQUESTED` action:

```javascript
import { takeEvery } from `redux-saga/effects`

function* fetchUser(action) {
  ...
}

function* watchFetchUser() {
  yield takeEvery('USER_REQUESTED', fetchUser)
}
```

#### Notes

`takeEvery` is a high-level API built using `take` and `fork`. Here is how the helper could be implemented using the low-level Effects

```javascript
const takeEvery = (patternOrChannel, saga, ...args) => fork(function*() {
  while (true) {
    const action = yield take(patternOrChannel)
    yield fork(saga, ...args.concat(action))
  }
})
```

`takeEvery` allows concurrent actions to be handled. In the example above, when a `USER_REQUESTED`
action is dispatched, a new `fetchUser` task is started even if a previous `fetchUser` is still pending
(for example, the user clicks on a `Load User` button 2 consecutive times at a rapid rate, the 2nd
click will dispatch a `USER_REQUESTED` action while the `fetchUser` fired on the first one hasn't yet terminated)

`takeEvery` doesn't handle out of order responses from tasks. There is no guarantee that the tasks will
terminate in the same order they were started. To handle out of order responses, you may consider `takeLatest`
below.

### `takeEvery(channel, saga, ...args)`

You can also pass in a channel as argument and the behaviour is the same as [takeEvery(pattern, saga, ...args)](#takeeverypattern-saga-args).

### `takeLatest(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`. And automatically cancels
any previous `saga` task started previously if it's still running.

Each time an action is dispatched to the store. And if this action matches `pattern`, `takeLatest`
starts a new `saga` task in the background. If a `saga` task was started previously (on the last action dispatched
before the actual action), and if this task is still running, the task will be cancelled.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeLatest` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a basic task `fetchUser`. We use `takeLatest` to
start a new `fetchUser` task on each dispatched `USER_REQUESTED` action. Since `takeLatest`
cancels any pending task started previously, we ensure that if a user triggers multiple consecutive
`USER_REQUESTED` actions rapidly, we'll only conclude with the latest action

```javascript
import { takeLatest } from `redux-saga/effects`

function* fetchUser(action) {
  ...
}

function* watchLastFetchUser() {
  yield takeLatest('USER_REQUESTED', fetchUser)
}
```

#### Notes

`takeLatest` is a high-level API built using `take` and `fork`. Here is how the helper could be implemented using the low-level Effects

```javascript
const takeLatest = (patternOrChannel, saga, ...args) => fork(function*() {
  let lastTask
  while (true) {
    const action = yield take(patternOrChannel)
    if (lastTask) {
      yield cancel(lastTask) // cancel is no-op if the task has already terminated
    }
    lastTask = yield fork(saga, ...args.concat(action))
  }
})
```

### `takeLatest(channel, saga, ...args)`

You can also pass in a channel as argument and the behaviour is the same as [takeLatest(pattern, saga, ...args)](#takelatestpattern-saga-args).

### `takeLeading(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`.
After spawning a task once, it blocks until spawned saga completes and then starts to listen for a `pattern` again.

In short, `takeLeading` is listening for the actions when it doesn't run a saga.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeLeading` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a basic task `fetchUser`. We use `takeLeading` to
start a new `fetchUser` task on each dispatched `USER_REQUESTED` action. Since `takeLeading`
ignores any new coming task after it's started, we ensure that if a user triggers multiple consecutive
`USER_REQUESTED` actions rapidly, we'll only keep on running with the leading action

```javascript
import { takeLeading } from `redux-saga/effects`

function* fetchUser(action) {
  ...
}

function* watchLastFetchUser() {
  yield takeLeading('USER_REQUESTED', fetchUser)
}
```

#### Notes

`takeLeading` is a high-level API built using `take` and `call`. Here is how the helper could be implemented using the low-level Effects

```javascript
const takeLeading = (patternOrChannel, saga, ...args) => fork(function*() {
  while (true) {
    const action = yield take(patternOrChannel);
    yield call(saga, ...args.concat(action));
  }
})
```

### `takeLeading(channel, saga, ...args)`

You can also pass in a channel as argument and the behavior is the same as [takeLeading(pattern, saga, ...args)](#takeleadingpattern-saga-args).

### `put(action)`

Creates an Effect description that instructs the middleware to dispatch an action to the Store.
This effect is non-blocking and any errors that are thrown downstream (e.g. in a reducer) will
not bubble back into the saga.

- `action: Object` - [see Redux `dispatch` documentation for complete info](http://redux.js.org/docs/api/Store.html#dispatch)

### `putResolve(action)`

Just like [`put`](#putaction) but the effect is blocking (if promise is returned from `dispatch` it will wait for its resolution) and will bubble up errors from downstream.

- `action: Object` - [see Redux `dispatch` documentation for complete info](http://redux.js.org/docs/api/Store.html#dispatch)

### `put(channel, action)`

Creates an Effect description that instructs the middleware to put an action into the provided channel.

- `channel: Channel` - a [`Channel`](#channel) Object.
- `action: Object` - [see Redux `dispatch` documentation for complete info](http://redux.js.org/docs/api/Store.html#dispatch)

This effect is blocking if the put is *not* buffered but immediately consumed by takers. If an error
is thrown in any of these takers it will bubble back into the saga.

### `call(fn, ...args)`

Creates an Effect description that instructs the middleware to call the function `fn` with `args` as arguments.

- `fn: Function` - A Generator function, or normal function which either returns a Promise as result, or any other value.
- `args: Array<any>` - An array of values to be passed as arguments to `fn`

#### Notes

`fn` can be either a *normal* or a Generator function.

The middleware invokes the function and examines its result.

If the result is an Iterator object, the middleware will run that Generator function, just like it did with the
startup Generators (passed to the middleware on startup). The parent Generator will be
suspended until the child Generator terminates normally, in which case the parent Generator
is resumed with the value returned by the child Generator. Or until the child aborts with some
error, in which case an error will be thrown inside the parent Generator.

If `fn` is a normal function and returns a Promise, the middleware will suspend the Generator until the Promise is
settled. After the promise is resolved the Generator is resumed with the resolved value, or if the Promise
is rejected an error is thrown inside the Generator.

If the result is not an Iterator object nor a Promise, the middleware will immediately return that value back to the saga,
so that it can resume its execution synchronously.

When an error is thrown inside the Generator, if it has a `try/catch` block surrounding the
current `yield` instruction, the control will be passed to the `catch` block. Otherwise,
the Generator aborts with the raised error, and if this Generator was called by another
Generator, the error will propagate to the calling Generator.

### `call([context, fn], ...args)`

Same as `call(fn, ...args)` but supports passing a `this` context to `fn`. This is useful to
invoke object methods.

### `call([context, fnName], ...args)`

Same as `call([context, fn], ...args)` but supports passing a `fn` as string. Useful for invoking object's methods, i.e. `yield call([localStorage, 'getItem'], 'redux-saga')`

### `call({context, fn}, ...args)`

Same as `call([context, fn], ...args)` but supports passing `context` and `fn` as properties of an object, i.e. `yield call({context: localStorage, fn: localStorage.getItem}, 'redux-saga')`. `fn` can be a string or a function.

### `apply(context, fn, [args])`

Alias for `call([context, fn], ...args)`.

### `cps(fn, ...args)`

Creates an Effect description that instructs the middleware to invoke `fn` as a Node style function.

- `fn: Function` - a Node style function. i.e. a function which accepts in addition to its arguments,
an additional callback to be invoked by `fn` when it terminates. The callback accepts two parameters,
where the first parameter is used to report errors while the second is used to report successful results

- `args: Array<any>` - an array to be passed as arguments for `fn`

#### Notes

The middleware will perform a call `fn(...arg, cb)`. The `cb` is a callback passed by the middleware to
`fn`. If `fn` terminates normally, it must call `cb(null, result)` to notify the middleware
of a successful result. If `fn` encounters some error, then it must call `cb(error)` in order to
notify the middleware that an error has occurred.

The middleware remains suspended until `fn` terminates.

### `cps([context, fn], ...args)`

Supports passing a `this` context to `fn` (object method invocation)

### `cps({context, fn}, ...args)`

Same as `cps([context, fn], ...args)` but supports passing `context` and `fn` as properties of an object. `fn` can be a string or a function.

### `fork(fn, ...args)`

Creates an Effect description that instructs the middleware to perform a *non-blocking call* on `fn`

#### Arguments

- `fn: Function` - A Generator function, or normal function which returns a Promise as result
- `args: Array<any>` - An array of values to be passed as arguments to `fn`

returns a [Task](#task) object.

#### Notes

`fork`, like `call`, can be used to invoke both normal and Generator functions. But, the calls are
non-blocking, the middleware doesn't suspend the Generator while waiting for the result of `fn`.
Instead as soon as `fn` is invoked, the Generator resumes immediately.

`fork`, alongside `race`, is a central Effect for managing concurrency between Sagas.

The result of `yield fork(fn ...args)` is a [Task](#task) object.  An object with some useful
methods and properties.

All forked tasks are *attached* to their parents. When the parent terminates the execution of its
own body of instructions, it will wait for all forked tasks to terminate before returning.

#### Error propagation
Errors from child tasks automatically bubble up to their parents. If any forked task raises an uncaught error, then
the parent task will abort with the child Error, and the whole Parent's execution tree (i.e. forked tasks + the
*main task* represented by the parent's body if it's still running) will be cancelled.

Cancellation of a forked Task will automatically cancel all forked tasks that are still executing. It'll
also cancel the current Effect where the cancelled task was blocked (if any).

If a forked task fails *synchronously* (ie: fails immediately after its execution before performing any
async operation), then no Task is returned, instead the parent will be aborted as soon as possible (since both
parent and child execute in parallel, the parent will abort as soon as it takes notice of the child failure).

To create *detached* forks, use `spawn` instead.

### `fork([context, fn], ...args)`

Supports invoking forked functions with a `this` context

### `fork({context, fn}, ...args)`

Same as `fork([context, fn], ...args)` but supports passing `context` and `fn` as properties of an object. `fn` can be a string or a function.

### `spawn(fn, ...args)`

Same as `fork(fn, ...args)` but creates a *detached* task. A detached task remains independent from its parent and acts like
a top-level task. The parent will not wait for detached tasks to terminate before returning and all events which may affect the
parent or the detached task are completely independents (error, cancellation).

### `spawn([context, fn], ...args)`

Supports spawning functions with a `this` context

### `join(task)`

Creates an Effect description that instructs the middleware to wait for the result
of a previously forked task.

- `task: Task` - A [Task](#task) object returned by a previous `fork`

#### Notes

`join` will resolve to the same outcome of the joined task (success or error). If the joined
task is cancelled, the cancellation will also propagate to the Saga executing the join
effect. Similarly, any potential callers of those joiners will be cancelled as well.

### `join([...tasks])`

Creates an Effect description that instructs the middleware to wait for the results of previously forked tasks.

- `tasks: Array<Task>` - A [Task](#task) is the object returned by a previous `fork`

#### Notes

It wraps the array of tasks in [join effects](#jointask), roughly becoming the equivalent of
`yield tasks.map(t => join(t))`.

### `cancel(task)`

Creates an Effect description that instructs the middleware to cancel a previously forked task.

- `task: Task` - A [Task](#task) object returned by a previous `fork`

#### Notes

To cancel a running task, the middleware will invoke `return` on the underlying Generator
object. This will cancel the current Effect in the task and jump to the finally block (if defined).

Inside the finally block, you can execute any cleanup logic or dispatch some action to keep the
store in a consistent state (e.g. reset the state of a spinner to false when an ajax request
is cancelled). You can check inside the finally block if a Saga was cancelled by issuing
a `yield cancelled()`.

Cancellation propagates downward to child sagas. When cancelling a task, the middleware will also
cancel the current Effect (where the task is currently blocked). If the current Effect
is a call to another Saga, it will be also cancelled. When cancelling a Saga, all *attached
forks* (sagas forked using `yield fork()`) will be cancelled. This means that cancellation
effectively affects the whole execution tree that belongs to the cancelled task.

`cancel` is a non-blocking Effect. i.e. the Saga executing it will resume immediately after
performing the cancellation.

For functions which return Promise results, you can plug your own cancellation logic
by attaching a `[CANCEL]` to the promise.

The following example shows how to attach cancellation logic to a Promise result:

```javascript
import { CANCEL } from 'redux-saga'
import { fork, cancel } from 'redux-saga/effects'

function myApi() {
  const promise = myXhr(...)

  promise[CANCEL] = () => myXhr.abort()
  return promise
}

function* mySaga() {

  const task = yield fork(myApi)

  // ... later
  // will call promise[CANCEL] on the result of myApi
  yield cancel(task)
}
```

redux-saga will automatically cancel jqXHR objects using their `abort` method.

### `cancel([...tasks])`

Creates an Effect description that instructs the middleware to cancel previously forked tasks.

- `tasks: Array<Task>` - A [Task](#task) is the object returned by a previous `fork`

#### Notes

It wraps the array of tasks in [cancel effects](#canceltask), roughly becoming the equivalent of
`yield tasks.map(t => cancel(t))`.

### `cancel()`

Creates an Effect description that instructs the middleware to cancel a task in which it has been yielded (self-cancellation).
It allows to reuse destructor-like logic inside a `finally` blocks for both outer (`cancel(task)`) and self (`cancel()`) cancellations.

#### Example

```javascript
function* deleteRecord({ payload }) {
  try {
    const { confirm, deny } = yield call(prompt);
    if (confirm) {
      yield put(actions.deleteRecord.confirmed())
    }
    if (deny) {
      yield cancel()
    }
  } catch(e) {
    // handle failure
  } finally {
    if (yield cancelled()) {
      // shared cancellation logic
      yield put(actions.deleteRecord.cancel(payload))
    }
  }
}
```

### `select(selector, ...args)`

Creates an effect that instructs the middleware to invoke the provided selector on the
current Store's state (i.e. returns the result of `selector(getState(), ...args)`).

- `selector: Function` - a function `(state, ...args) => args`. It takes the
current state and optionally some arguments and returns a slice of the current Store's state

- `args: Array<any>` - optional arguments to be passed to the selector in addition of `getState`.

If `select` is called without argument (i.e. `yield select()`) then the effect is resolved
with the entire state (the same result of a `getState()` call).

> It's important to note that when an action is dispatched to the store, the middleware first
forwards the action to the reducers and then notifies the Sagas. This means that when you query the
Store's State, you get the State **after** the action has been applied.
> However, this behavior is only guaranteed if all subsequent middlewares call `next(action)` synchronously.  If any subsequent middleware calls `next(action)` asynchronously (which is unusual but possible), then the sagas will get the state from **before** the action is applied.  Therefore it is recommended to review the source of each subsequent middleware to ensure it calls `next(action)` synchronously, or else ensure that redux-saga is the last middleware in the call chain.

#### Notes

Preferably, a Saga should be autonomous and should not depend on the Store's state. This makes
it easy to modify the state implementation without affecting the Saga code. A saga should preferably
depend only on its own internal control state when possible. But sometimes, one could
find it more convenient for a Saga to query the state instead of maintaining the needed data by itself
(for example, when a Saga duplicates the logic of invoking some reducer to compute a state that was
already computed by the Store).

For example, suppose we have this state shape in our application:

```javascript
state = {
  cart: {...}
}
```

We can create a *selector*, i.e. a function which knows how to extract the `cart` data from the State:

`./selectors`
```javascript
export const getCart = state => state.cart
```

Then we can use that selector from inside a Saga using the `select` Effect:

`./sagas.js`
```javascript
import { take, fork, select } from 'redux-saga/effects'
import { getCart } from './selectors'

function* checkout() {
  // query the state using the exported selector
  const cart = yield select(getCart)

  // ... call some API endpoint then dispatch a success/error action
}

export default function* rootSaga() {
  while (true) {
    yield take('CHECKOUT_REQUEST')
    yield fork(checkout)
  }
}
```

`checkout` can get the needed information directly by using `select(getCart)`. The Saga is coupled only with the `getCart` selector. If we have many Sagas (or React Components) that needs to access the `cart` slice, they will all be coupled to the same function `getCart`. And if we now change the state shape, we need only to update `getCart`.

### `actionChannel(pattern, [buffer])`

Creates an effect that instructs the middleware to queue the actions matching `pattern` using an event channel. Optionally, you can provide a buffer to control buffering of the queued actions.

- `pattern:` - see API for `take(pattern)`
- `buffer: Buffer` - a [Buffer](#buffer) object

#### Example

The following code creates a channel to buffer all `USER_REQUEST` actions. Note that even the Saga may be blocked
on the `call` effect. All actions that come while it's blocked are automatically buffered. This causes the Saga
to execute the API calls one at a time

```javascript
import { actionChannel, call } from 'redux-saga/effects'
import api from '...'

function* takeOneAtMost() {
  const chan = yield actionChannel('USER_REQUEST')
  while (true) {
    const {payload} = yield take(chan)
    yield call(api.getUser, payload)
  }
}
```

### `flush(channel)`

Creates an effect that instructs the middleware to flush all buffered items from the channel. Flushed items are returned back to the saga, so they can be utilized if needed.

- `channel: Channel` - a [`Channel`](#channel) Object.

#### Example

```javascript

function* saga() {
  const chan = yield actionChannel('ACTION')

  try {
    while (true) {
      const action = yield take(chan)
      // ...
    }
  } finally {
    const actions = yield flush(chan)
    // ...
  }

}
```

### `cancelled()`

Creates an effect that instructs the middleware to return whether this generator has been cancelled. Typically
you use this Effect in a finally block to run Cancellation specific code

#### Example

```javascript

function* saga() {
  try {
    // ...
  } finally {
    if (yield cancelled()) {
      // logic that should execute only on Cancellation
    }
    // logic that should execute in all situations (e.g. closing a channel)
  }
}
```

### `setContext(props)`

Creates an effect that instructs the middleware to update its own context. This effect extends
saga's context instead of replacing it.

### `getContext(prop)`

Creates an effect that instructs the middleware to return a specific property of saga's context.

### `delay(ms, [val])`

Returns an effect descriptor to block execution for `ms` milliseconds and return `val` value.

### `throttle(ms, pattern, saga, ...args)`

Spawns a `saga` on an action dispatched to the Store that matches `pattern`. After spawning a task it's still accepting incoming actions into the underlying `buffer`, keeping at most 1 (the most recent one), but in the same time holding up with spawning new task for `ms` milliseconds (hence its name - `throttle`). Purpose of this is to ignore incoming actions for a given period of time while processing a task.

- `ms: Number` - length of a time window in milliseconds during which actions will be ignored after the action starts processing

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `throttle` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a basic task `fetchAutocomplete`. We use `throttle` to
start a new `fetchAutocomplete` task on dispatched `FETCH_AUTOCOMPLETE` action. However since `throttle` ignores consecutive `FETCH_AUTOCOMPLETE` for some time, we ensure that user won't flood our server with requests.

```javascript
import { call, put, throttle } from `redux-saga/effects`

function* fetchAutocomplete(action) {
  const autocompleteProposals = yield call(Api.fetchAutocomplete, action.text)
  yield put({type: 'FETCHED_AUTOCOMPLETE_PROPOSALS', proposals: autocompleteProposals})
}

function* throttleAutocomplete() {
  yield throttle(1000, 'FETCH_AUTOCOMPLETE', fetchAutocomplete)
}
```

#### Notes

`throttle` is a high-level API built using `take`, `fork` and `actionChannel`. Here is how the helper could be implemented using the low-level Effects

```javascript
const throttle = (ms, pattern, task, ...args) => fork(function*() {
  const throttleChannel = yield actionChannel(pattern, buffers.sliding(1))

  while (true) {
    const action = yield take(throttleChannel)
    yield fork(task, ...args, action)
    yield delay(ms)
  }
})
```

### `throttle(ms, channel, saga, ...args)`
You can also handle a channel as argument and the behaviour is the same as [`throttle(ms, pattern, saga, ..args)`](#throttlems-pattern-saga-args)

### `debounce(ms, pattern, saga, ...args)`

Spawns a `saga` on an action dispatched to the Store that matches `pattern`. Saga will be called after it stops taking `pattern` actions for `ms` milliseconds. Purpose of this is to prevent calling saga until the actions are settled off.

- `ms: Number` - defines how many milliseconds should elapse since the last time `pattern` action was fired to call the `saga`

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `debounce` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a basic task `fetchAutocomplete`. We use `debounce` to
delay calling `fetchAutocomplete` saga until we stop receive any `FETCH_AUTOCOMPLETE` events for at least `1000` ms.

```javascript
import { call, put, debounce } from `redux-saga/effects`

function* fetchAutocomplete(action) {
  const autocompleteProposals = yield call(Api.fetchAutocomplete, action.text)
  yield put({type: 'FETCHED_AUTOCOMPLETE_PROPOSALS', proposals: autocompleteProposals})
}

function* debounceAutocomplete() {
  yield debounce(1000, 'FETCH_AUTOCOMPLETE', fetchAutocomplete)
}
```

#### Notes

`debounce` is a high-level API built using `take`, `delay`, `race` and `fork`. Here is how the helper could be implemented using the low-level Effects

```javascript
const debounce = (ms, pattern, task, ...args) => fork(function*() {
  while (true) {
    let action = yield take(pattern)

    while (true) {
      const { debounced, latestAction } = yield race({
        debounced: delay(ms),
        latestAction: take(pattern)
      })

      if (debounced) {
        yield fork(task, ...args, action)
        break
      }

      action = latestAction
    }
  }
})
```

### `debounce(ms, channel, saga, ...args)`
You can also handle a channel as argument and the behaviour is the same as [`debounce(ms, pattern, saga, ..args)`](#debouncems-pattern-saga-args)

### `retry(maxTries, delay, fn, ...args)`
Creates an Effect description that instructs the middleware to call the function `fn` with `args` as arguments.
In case of failure will try to make another call after `delay` milliseconds, if a number of attempts < `maxTries`.

- `maxTries: Number` - maximum calls count.
- `delay: Number` - length of a time window in milliseconds between `fn` calls.
- `fn: Function` - A Generator function, or normal function which either returns a Promise as a result, or any other value.
- `args: Array<any>` - An array of values to be passed as arguments to `fn`

#### Example

In the following example, we create a basic task `retrySaga`. We use `retry` to try to fetch our API 3 times with 10 second interval. If `request` fails first time than `retry` will call `request` one more time while calls count less than 3.

```javascript
import { put, retry } from 'redux-saga/effects'
import { request } from 'some-api';

function* retrySaga(data) {
  try {
    const SECOND = 1000
    const response = yield retry(3, 10 * SECOND, request, data)
    yield put({ type: 'REQUEST_SUCCESS', payload: response })
  } catch(error) {
    yield put({ type: 'REQUEST_FAIL', payload: { error } })
  }
}
```

#### Notes
`retry` is a high-level API built using `delay` and `call`. [Here is how the helper could be implemented using the low-level Effects](/docs/recipes/#retrying-xhr-calls)

## Effect combinators

### `race(effects)`

Creates an Effect description that instructs the middleware to run a *Race* between
multiple Effects (this is similar to how [`Promise.race([...])`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) behaves).

`effects: Object` - a dictionary Object of the form {label: effect, ...}

#### Example

The following example runs a race between two effects:

1. A call to a function `fetchUsers` which returns a Promise
2. A `CANCEL_FETCH` action which may be eventually dispatched on the Store

```javascript
import { take, call, race } from `redux-saga/effects`
import fetchUsers from './path/to/fetchUsers'

function* fetchUsersSaga() {
  const { response, cancel } = yield race({
    response: call(fetchUsers),
    cancel: take(CANCEL_FETCH)
  })
}
```

If `call(fetchUsers)` resolves (or rejects) first, the result of `race` will be an object
with a single keyed object `{response: result}` where `result` is the resolved result of `fetchUsers`.

If an action of type `CANCEL_FETCH` is dispatched on the Store before `fetchUsers` completes, the result
will be a single keyed object `{cancel: action}`, where action is the dispatched action.

#### Notes

When resolving a `race`, the middleware automatically cancels all the losing Effects.

### `race([...effects]) (with Array)`

The same as [`race(effects)`](#raceeffects) but lets you pass in an array of effects.

#### Example

The following example runs a race between two effects:

1. A call to a function `fetchUsers` which returns a Promise
2. A `CANCEL_FETCH` action which may be eventually dispatched on the Store

```javascript
import { take, call, race } from `redux-saga/effects`
import fetchUsers from './path/to/fetchUsers'

function* fetchUsersSaga() {
  const [response, cancel] = yield race([
    call(fetchUsers),
    take(CANCEL_FETCH)
  ])
}
```

If `call(fetchUsers)` resolves (or rejects) first, `response` will be an result of `fetchUsers` and `cancel` will be `undefined`.

If an action of type `CANCEL_FETCH` is dispatched on the Store before `fetchUsers` completes, `response` will be
`undefined` and `cancel` will be the dispatched action.

### `all([...effects]) - parallel effects`

Creates an Effect description that instructs the middleware to run multiple Effects
in parallel and wait for all of them to complete. It's quite the corresponding API to standard [`Promise#all`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

#### Example

The following example runs two blocking calls in parallel:

```javascript
import { fetchCustomers, fetchProducts } from './path/to/api'
import { all, call } from `redux-saga/effects`

function* mySaga() {
  const [customers, products] = yield all([
    call(fetchCustomers),
    call(fetchProducts)
  ])
}
```

### `all(effects)`

The same as [`all([...effects])`](#alleffects-parallel-effects) but lets you to pass in a dictionary object of effects with labels, just like [`race(effects)`](#raceeffects)

- `effects: Object` - a dictionary Object of the form {label: effect, ...}

#### Example

The following example runs two blocking calls in parallel:

```javascript
import { fetchCustomers, fetchProducts } from './path/to/api'
import { all, call } from `redux-saga/effects`

function* mySaga() {
  const { customers, products } = yield all({
    customers: call(fetchCustomers),
    products: call(fetchProducts)
  })
}
```

#### Notes

When running Effects in parallel, the middleware suspends the Generator until one of the following occurs:

- All the Effects completed with success: resumes the Generator with an array containing the results of all Effects.

- One of the Effects was rejected before all the effects complete: throws the rejection error inside the Generator.

## Interfaces

### Task

The Task interface specifies the result of running a Saga using `fork`, `middleware.run` or `runSaga`.

<table id="task-descriptor">
  <tr>
    <th>method</th>
    <th>return value</th>
  </tr>
  <tr>
    <td>task.isRunning()</td>
    <td>true if the task hasn't yet returned or thrown an error</td>
  </tr>
  <tr>
    <td>task.isCancelled()</td>
    <td>true if the task has been cancelled</td>
  </tr>
  <tr>
    <td>task.result()</td>
    <td>task return value. `undefined` if task is still running</td>
  </tr>
  <tr>
    <td>task.error()</td>
    <td>task thrown error. `undefined` if task is still running</td>
  </tr>
  <tr>
    <td>task.toPromise()</td>
    <td>
      a Promise which is either:
        <ul>
          <li>resolved with task's return value</li>
          <li>rejected with task's thrown error</li>
        </ul>
      </td>
  </tr>
  <tr>
    <td>task.cancel()</td>
    <td>Cancels the task (If it is still running)</td>
  </tr>
</table>

### Channel

A channel is an object used to send and receive messages between tasks. Messages from senders are queued until an interested receiver request a message, and registered receiver is queued until a message is available.

Every channel has an underlying buffer which defines the buffering strategy (fixed size, dropping, sliding)

The Channel interface defines 3 methods: `take`, `put` and `close`

`Channel.take(callback):` used to register a taker. The take is resolved using the following rules

- If the channel has buffered messages, then `callback` will be invoked with the next message from the underlying buffer (using `buffer.take()`)
- If the channel is closed and there are no buffered messages, then `callback` is invoked with `END`
- Otherwise`callback` will be queued until a message is put into the channel

`Channel.put(message):` Used to put message on the buffer. The put will be handled using the following rules

- If the channel is closed, then the put will have no effect.
- If there are pending takers, then invoke the oldest taker with the message.
- Otherwise put the message on the underlying buffer

`Channel.flush(callback):` Used to extract all buffered messages from the channel. The flush is resolved using the following rules

- If the channel is closed and there are no buffered messages, then `callback` is invoked with `END`
- Otherwise `callback` is invoked with all buffered messages.

`Channel.close():` closes the channel which means no more puts will be allowed. All pending takers will be invoked with `END`.

### Buffer

Used to implement the buffering strategy for a channel. The Buffer interface defines 3 methods: `isEmpty`, `put` and `take`

- `isEmpty()`: returns true if there are no messages on the buffer. A channel calls this method whenever a new taker is registered
- `put(message)`: used to put new message in the buffer. Note the Buffer can choose to not store the message
(e.g. a dropping buffer can drop any new message exceeding a given limit)
- `take()` used to retrieve any buffered message. Note the behavior of this method has to be consistent with `isEmpty`

### SagaMonitor

Used by the middleware to dispatch monitoring events. Actually the middleware dispatches 6 events:

- When a root saga is started (via `runSaga` or `sagaMiddleware.run`) the middleware invokes `sagaMonitor.rootSagaStarted`

- When an effect is triggered (via `yield someEffect`) the middleware invokes `sagaMonitor.effectTriggered`

- If the effect is resolved with success the middleware invokes `sagaMonitor.effectResolved`

- If the effect is rejected with an error the middleware invokes `sagaMonitor.effectRejected`

- If the effect is cancelled the middleware invokes `sagaMonitor.effectCancelled`

- Finally, the middleware invokes `sagaMonitor.actionDispatched` when a Redux action is dispatched.

Below the signature for each method

- `sagaMonitor.rootSagaStarted(options)` : where options is an object with the following fields

  - `effectId` : Number - Unique ID assigned to this root saga execution

  - `saga` : Function - The generator function that starts to run

  - `args` : Array - The arguments passed to the generator function

- `effectTriggered(options)`

  - `effectId` : Number - Unique ID assigned to the yielded effect

  - `parentEffectId` : Number - ID of the parent Effect. In the case of a `race` or `parallel` effect, all
  effects yielded inside will have the direct race/parallel effect as a parent. In case of a top-level effect, the
  parent will be the containing Saga

  - `label` : String - In case of a `race`/`all` effect, all child effects will be assigned as label the corresponding
  keys of the object passed to `race`/`all`

  - `effect` : Object - the yielded effect itself

- `effectResolved(effectId, result)`

    - `effectId` : Number - The ID of the yielded effect

    - `result` : any - The result of the successful resolution of the effect. In case of `fork` or `spawn` effects,
    the result will be a `Task` object.

- `effectRejected(effectId, error)`

    - `effectId` : Number - The ID of the yielded effect

    - `error` : any - Error raised with the rejection of the effect

- `effectCancelled(effectId)`

    - `effectId` : Number - The ID of the yielded effect

- `actionDispatched(action)`

    - `action` : Object - The dispatched Redux action. If the action was dispatched by a Saga
    then the action will have a property `SAGA_ACTION` set to true (`SAGA_ACTION` can be imported from
    `@redux-saga/symbols`).


## External API
------------------------

### `runSaga(options, saga, ...args)`

Allows starting sagas outside the Redux middleware environment. Useful if you want to
connect a Saga to external input/output, other than store actions.

`runSaga` returns a Task object. Just like the one returned from a `fork` effect.

- `options: Object` - currently supported options are:
  - `channel` - see docs for [`channel`](#channel) (preferably you should use `stdChannel` here)

  - `dispatch(output): Function` - used to fulfill `put` effects.
    - `output: any` -  argument provided by the Saga to the `put` Effect (see Notes below).

  - `getState(): Function` - used to fulfill `select` and `getState` effects

  - `sagaMonitor` : [SagaMonitor](#sagamonitor) - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)

  - `onError: Function` - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)

  - `context` : {} - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)
  - `effectMiddlewares` : Function[] - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be provided to `saga`

#### Notes

The `{channel, dispatch}` is used to fulfill `take` and `put` Effects. This defines the Input/Output
interface of the Saga.

`channel` is used to fulfill `take(PATTERN)` effects. Every time something gets put on the channel it's
notifying all pending internal listeners. If the Saga is blocked on a `take` effect, and
if the take pattern matches the currently incoming input, the Saga is resumed with that input.

`dispatch` is used to fulfill `put` effects. Each time the Saga emits a `yield put(output)`, `dispatch`
is invoked with output.

An example how to use this API may be found [here](../advanced/UsingRunSaga.md).

## Utils

### `channel([buffer])`

A factory method that can be used to create Channels. You can optionally pass it a buffer
to control how the channel buffers the messages.

By default, if no buffer is provided, the channel will queue incoming messages up to 10 until interested takers are registered. The default buffering will deliver message using a FIFO strategy: a new taker will be delivered the oldest message in the buffer.

### `eventChannel(subscribe, [buffer])`

Creates channel that will subscribe to an event source using the `subscribe` method. Incoming events from the event source will be queued in the channel until interested takers are registered.

- `subscribe: Function` used to subscribe to the underlying event source. The function must return an unsubscribe function to terminate the subscription.

- `buffer: Buffer` optional Buffer object to buffer messages on this channel. If not provided, messages will not be buffered
on this channel.

To notify the channel that the event source has terminated, you can notify the provided subscriber with an `END`

#### Example

In the following example we create an event channel that will subscribe to a `setInterval`

```javascript
const countdown = (secs) => {
  return eventChannel(emitter => {
      const iv = setInterval(() => {
        console.log('countdown', secs)
        secs -= 1
        if (secs > 0) {
          emitter(secs)
        } else {
          emitter(END)
          clearInterval(iv)
          console.log('countdown terminated')
        }
      }, 1000);
      return () => {
        clearInterval(iv)
        console.log('countdown cancelled')
      }
    }
  )
}
```

### `buffers`

Provides some common buffers

- `buffers.none()`: no buffering, new messages will be lost if there are no pending takers

- `buffers.fixed(limit)`: new messages will be buffered up to `limit`. Overflow will raise an Error. Omitting a `limit` value will result in a limit of 10.

- `buffers.expanding(initialSize)`: like `fixed` but Overflow will cause the buffer to expand dynamically.

- `buffers.dropping(limit)`: same as `fixed` but Overflow will silently drop the messages.

- `buffers.sliding(limit)`: same as `fixed` but Overflow will insert the new message at the end and drop the oldest message in the buffer.


### `cloneableGenerator(generatorFunc)`

Takes a generator function (function*) and returns a generator function.
All generators instanciated from this function will be cloneable.
For testing purpose only.

#### Example

This is useful when you want to test a different branch of a saga without having to replay the actions that lead to it.

```javascript
import { cloneableGenerator } from '@redux-saga/testing-utils';

function* oddOrEven() {
  // some stuff are done here
  yield 1;
  yield 2;
  yield 3;

  const userInput = yield 'enter a number';
  if (userInput % 2 === 0) {
    yield 'even';
  } else {
    yield 'odd'
  }
}

test('my oddOrEven saga', assert => {
  const data = {};
  data.gen = cloneableGenerator(oddOrEven)();

  assert.equal(
    data.gen.next().value,
    1,
    'it should yield 1'
  );

  assert.equal(
    data.gen.next().value,
    2,
    'it should yield 2'
  );

  assert.equal(
    data.gen.next().value,
    3,
    'it should yield 3'
  );

  assert.equal(
    data.gen.next().value,
    'enter a number',
    'it should ask for a number'
  );

  assert.test('even number is given', a => {
    // we make a clone of the generator before giving the number;
    data.clone = data.gen.clone();

    a.equal(
      data.gen.next(2).value,
      'even',
      'it should yield "even"'
    );

    a.equal(
      data.gen.next().done,
      true,
      'it should be done'
    );

    a.end();
  });

  assert.test('odd number is given', a => {

    a.equal(
      data.clone.next(1).value,
      'odd',
      'it should yield "odd"'
    );

    a.equal(
      data.clone.next().done,
      true,
      'it should be done'
    );

    a.end();
  });

  assert.end();
});

```
### `createMockTask()`

Returns an object that mocks a task.
For testing purposes only.
[See Task Cancellation docs for more information.](/docs/advanced/TaskCancellation.md#testing-generators-with-fork-effect)
)

## Cheatsheets

### Blocking / Non-blocking

| Name                 | Blocking                                                    |
| -------------------- | ------------------------------------------------------------|
| takeEvery            | No                                                          |
| takeLatest           | No                                                          |
| takeLeading          | No                                                          |
| throttle             | No                                                          |
| debounce             | No                                                          |
| retry                | Yes                                                         |
| take                 | Yes                                                         |
| take(channel)        | Sometimes (see API reference)                               |
| takeMaybe            | Yes                                                         |
| put                  | No                                                          |
| putResolve           | Yes                                                         |
| put(channel, action) | No                                                          |
| call                 | Yes                                                         |
| apply                | Yes                                                         |
| cps                  | Yes                                                         |
| fork                 | No                                                          |
| spawn                | No                                                          |
| join                 | Yes                                                         |
| cancel               | No                                                          |
| select               | No                                                          |
| actionChannel        | No                                                          |
| flush                | Yes                                                         |
| cancelled            | Yes                                                         |
| race                 | Yes                                                         |
| delay                | Yes                                                         |
| all                  | Blocks if there is a blocking effect in the array or object |
