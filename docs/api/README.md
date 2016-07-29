# API Reference

* [`Middleware API`](#middleware-api)
  * [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)
  * [`middleware.run(saga, ...args)`](#middlewarerunsaga-args)
* [`Saga Helpers`](#saga-helpers)
  * [`takeEvery(pattern, saga, ...args)`](#takeeverypattern-saga-args)
  * [`takeLatest(pattern, saga, ..args)`](#takelatestpattern-saga-args)
* [`Effect creators`](#effect-creators)
  * [`take(pattern)`](#takepattern)
  * [`takem(pattern)`](#takempattern)
  * [`take(channel)`](#takechannel)
  * [`takem(channel)`](#takemchannel)
  * [`put(action)`](#putaction)
  * [`put(channel, action)`](#putchannelaction)
  * [`call(fn, ...args)`](#callfn-args)
  * [`call([context, fn], ...args)`](#callcontext-fn-args)
  * [`apply(context, fn, args)`](#applycontext-fn-args)
  * [`cps(fn, ...args)`](#cpsfn-args)
  * [`cps([context, fn], ...args)`](#cpscontext-fn-args)
  * [`fork(fn, ...args)`](#forkfn-args)
  * [`fork([context, fn], ...args)`](#forkcontext-fn-args)
  * [`spawn(fn, ...args)`](#spawnfn-args)
  * [`spawn([context, fn], ...args)`](#spawncontext-fn-args)
  * [`join(task)`](#jointask)
  * [`cancel(task)`](#canceltask)
  * [`select(selector, ...args)`](#selectselector-args)
  * [`actionChannel(pattern, [buffer])`](#actionchannelpattern-buffer)
  * [`cancelled()`](#cancelled)
* [`Effect combinators`](#effect-combinators)
  * [`race(effects)`](#raceeffects)
  * [`[...effects] (aka parallel effects)`](#effects-parallel-effects)
* [`Interfaces`](#interfaces)
  * [`Task`](#task)
  * [`Channel`](#channel)
  * [`Buffer`](#buffer)
  * [`SagaMonitor`](#sagamonitor)
* [`External API`](#external-api)
  * [`runSaga(iterator, options)`](#runsagaiterator-options)
* [`Utils`](#utils)
  * [`channel([buffer])`](#channelbuffer)
  * [`eventChannel(subscribe, [buffer], matcher)`](#eventchannelsubscribebuffermatcher)
  * [`buffers`](#buffers)
  * [`delay(ms, [val])`](#delayms-val)

## Middleware API

### `createSagaMiddleware(options)`

Creates a Redux middleware and connects the Sagas to the Redux Store

- `options: Object` - A list of options to pass to the middleware. Currently supported options are:

- `sagaMonitor` : [SagaMonitor](#sagamonitor) - If a Saga Monitor is provided, the middleware will deliver monitoring events to the monitor.

- `logger` : Function -  defines a custom logger for the middleware. By default, the middleware logs all errors and
warnings to the console. This option tells the middleware to send errors/warnings to the provided logger instead. The logger is called with the params `(level, ...args)`. The 1st indicates the level of the log ('info', 'warning' or 'error'). The rest
corresponds to the following arguments (You can use `args.join(' ') to concatenate all args into a single StringS`).

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

`saga` may also start other sagas using the various Effects provided by the library. The iteration process process described below is also applied to all child sagas.

In the first iteration, the middleware invokes the `next()` method to retrieve the next Effect. The middleware then executes the yielded Effect as specified by the Effects API below. Meanwhile, the Generator will be suspended until the effect execution terminates. Upon receiving the result of the execution, the middleware calls `next(result)` on the Generator passing it the retrieved result as an argument. This process is repeated until the Generator terminates normally or by throwing some error.

If the execution results in an error (as specified by each Effect creator) then the `throw(error)` method of the Generator is called instead. If the Generator function defines a `try/catch` surrounding the current yield instruction, then the `catch` block will be invoked by the underlying Generator runtime. The runtime will also invoke any corresponding finally block.

In the case a Saga is cancelled (either manually or using the provided Effects), the middleware will invoke `return()` method of the Generator. This will cause the Generator to skip directly to the finally block.

## Saga Helpers

> Note: the following functions are helper functions built on top of the Effect creators
below.

### `takeEvery(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeEvery` will add the incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a simple task `fetchUser`. We use `takeEvery` to start a new `fetchUser` task on each dispatched `USER_REQUESTED` action:

```javascript
import { takeEvery } from `redux-saga`

function* fetchUser(action) {
  ...
}

function* watchFetchUser() {
  yield* takeEvery('USER_REQUESTED', fetchUser)
}
```

#### Notes

`takeEvery` is a high-level API built using `take` and `fork`. Here is how the helper is implemented:

```javascript
function* takeEvery(pattern, saga, ...args) {
  while (true) {
    const action = yield take(pattern)
    yield fork(saga, ...args.concat(action))
  }
}
```

`takeEvery` allows concurrent actions to be handled. In the example above, when a `USER_REQUESTED`
action is dispatched, a new `fetchUser` task is started even if a previous `fetchUser` is still pending
(for example, the user clicks on a `Load User` button 2 consecutive times at a rapid rate, the 2nd
click will dispatch a `USER_REQUESTED` action while the `fetchUser` fired on the first one hasn't yet terminated)

`takeEvery` doesn't handle out of order responses from tasks. There is no guarantee that the tasks will
termiate in the same order they were started. To handle out of order responses, you may consider `takeLatest`
below.

### `takeLatest(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`. And automatically cancels
any previous `saga` task started previous if it's still running.

Each time an action is dispatched to the store. And if this action matches `pattern`, `takeLatest`
starts a new `saga` task in the background. If a `saga` task was started previously (on the last action dispatched
before the actual action), and if this task is still running, the task will be cancelled.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeLatest` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a simple task `fetchUser`. We use `takeLatest` to
start a new `fetchUser` task on each dispatched `USER_REQUESTED` action. Since `takeLatest`
cancels any pending task started previously, we ensure that if a user triggers multiple consecutive
`USER_REQUESTED` actions rapidly, we'll only conclude with the latest action

```javascript
import { takeLatest } from `redux-saga`

function* fetchUser(action) {
  ...
}

function* watchLastFetchUser() {
  yield* takeLatest('USER_REQUESTED', fetchUser)
}
```

#### Notes

`takeLatest` is a high-level API built using `take` and `fork`. Here is how the helper is implemented

```javascript
function* takeLatest(pattern, saga, ...args) {
  let lastTask
  while (true) {
    const action = yield take(pattern)
    if (lastTask)
      yield cancel(lastTask) // cancel is no-op if the task has already terminated

    lastTask = yield fork(saga, ...args.concat(action))
  }
}
```

## Effect creators

> Notes:

> - Each function below returns a plain JavaScript object and does not perform any execution.
> - The execution is performed by the middleware during the Iteration process described above.
> - The middleware examines each Effect description and performs the appropriate action.

### `take(pattern)`

Creates an Effect description that instructs the middleware to wait for a specified action on the Store.
The Generator is suspended until an action that matches `pattern` is dispatched.

`pattern` is interpreted using the following rules:

- If `take` is called with no arguments or `'*'` all dispatched actions are matched (e.g. `take()` will match all actions)

- If it is a function, the action is matched if `pattern(action)` is true (e.g. `take(action => action.entities)` will match all actions having a (truthy) `entities`field.)

- If it is a String, the action is matched if `action.type === pattern` (e.g. `take(INCREMENT_ASYNC)`

- If it is an array, `action.type` is matched against all items in the array (e.g. `take([INCREMENT, DECREMENT])` will match either actions of type `INCREMENT` or `DECREMENT`).

The middleware provides a special action `END`. If you dispatch the END action, then all Sagas blocked on a take Effect will be terminated regardless of the specified pattern. If the terminated Saga has still some forked tasks which are still running, it will wait for all the child tasks to terminate before terminating the Task.

### `takem(pattern)`

Same as `take(pattern)` but does not automatically terminate the Saga on an `END` action. Instead all Sagas blocked on a take Effect will get the `END` object.

### `take(channel)`

Creates an Effect description that instructs the middleware to wait for a specified message from the provided Channel. If the channel is already closed, then the Generator will immediately terminate following the same process described above for `take(pattern)`.

### `takem(channel)`

Same as `take(channel)` but does not automatically terminate the Saga on an `END` action. Instead all takers are resumed with `END`

### `put(action)`

Creates an Effect description that instructs the middleware to dispatch an action to the Store.

- `action: Object` - [see Redux `dispatch` documentation for complete info](http://redux.js.org/docs/api/Store.html#dispatch)

### `put(channel, action)`

Creates an Effect description that instructs the middleware to put an action into the provided channel.

- `channel: Channel` - a [`Channel`](#channel) Object.
- `action: Object` - [see Redux `dispatch` documentation for complete info](http://redux.js.org/docs/api/Store.html#dispatch)

### `call(fn, ...args)`

Creates an Effect description that instructs the middleware to call the function `fn` with `args` as arguments.

- `fn: Function` - A Generator function, or normal function which returns a Promise as result

- `args: Array<any>` - An array of values to be passed as arguments to `fn`

#### Notes

`fn` can be either a *normal* or a Generator function.

The middleware invokes the function and examines its result.

If the result is a Generator object, the middleware will run it just like he did with the
startup Generators (passed to the middleware on startup). The parent Generator will be
suspended until the child Generator terminates normally, in which case the parent Generator
is resumed with the value returned by the child Generator. Or until the child aborts with some
error, in which case an error will be thrown inside the parent Generator.

If the result is a Promise, the middleware will suspend the Generator until the Promise is
resolved, in which case the Generator is resumed with the resolved value. or until the Promise
is rejected, in which case an error is thrown inside the Generator.

When an error is thrown inside the Generator. If it has a `try/catch` block surrounding the
current `yield` instruction, the control will be passed to the `catch` block. Otherwise,
the Generator aborts with the raised error, and if this Generator was called by another
Generator, the error will propagate to the calling Generator.

### `call([context, fn], ...args)`

Same as `call(fn, ...args)` but supports passing a `this` context to `fn`. This is useful to
invoke object methods.

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

### `fork(fn, ...args)`

Creates an Effect description that instructs the middleware to perform a *non-blocking call* on `fn`

#### Arguments

- `fn: Function` - A Generator function, or normal function which returns a Promise as result

- `args: Array<any>` - An array of values to be passed as arguments to `fn`

#### Note

`fork`, like `call`, can be used to invoke both normal and Generator functions. But, the calls are
non-blocking, the middleware doesn't suspend the Generator while waiting for the result of `fn`.
Instead as soon as `fn` is invoked, the Generator resumes immediately.

`fork`, alongside `race`, is a central Effect for managing concurrency between Sagas.

The result of `yield fork(fn ...args)` is a [Task](#task) object.  An object with some useful
methods and properties.

All forked tasks are *attached* to their parents. When the parent terminates the execution of its
own body of instructions, it will wait for all forked tasks to terminate before returning. Errors from
child tasks automatically bubble up to their parents. If any forked task raises an uncaught error, then
the parent task will aborts with the child Error, and the whole Parent's execution tree (i.e. forked tasks + the
*main task* represented by the parent's body if it's still running) will be cancelled.

Cancellation of the parent from another Generator will automatically cancel all forked tasks that are still executing.

To create *detached* forks, use `spawn` instead.

### `fork([context, fn], ...args)`

Supports invoking forked functions with a `this` context

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
the task is cancelled, the cancellation will also propagate to the Saga executing the join effect
effect. Similarly, any potential callers of those joiners will be cancelled as well.

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

`pattern:` - see API for `take(pattern)`
`buffer: Buffer` - a [Buffer](#buffer) object

#### Example

The following code creates channel to buffer all `USER_REQUEST` actions. Note that even the Saga maybe blocked
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

## Effect combinators

### `race(effects)`

Creates an Effect description that instructs the middleware to run a *Race* between
multiple Effects (this is similar to how `Promise.race([...])` behaves).

`effects: Object` - a dictionary Object of the form {label: effect, ...}

#### Example

The following example runs a race between two effects:

1. A call to a function `fetchUsers` which returns a Promise
2. A `CANCEL_FETCH` action which may be eventually dispatched on the Store

```javascript
import { take, call } from `redux-saga/effects`
import fetchUsers from './path/to/fetchUsers'

function* fetchUsersSaga {
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

### `[...effects] (parallel effects)`

Creates an Effect description that instructs the middleware to run multiple Effects
in parallel and wait for all of them to complete.

#### Example

The following example runs two blocking calls in parallel:

```javascript
import { fetchCustomers, fetchProducts } from './path/to/api'

function* mySaga() {
  const [customers, products] = yield [
    call(fetchCustomers),
    call(fetchProducts)
  ]
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
    <td>task.done</td>
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

A channel is an object used to send and receive messages between tasks. Messages from senders are queued until an interested receiver request a message, and registered receiver is queued until a message is disponible.

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

`Channel.close():` closes the channel which means no more puts will be allowed. If there are pending takers and no buffered messages, then all takers will be invoked with `END`. If there are buffered messages, then those messages will be delivered first to takers until the buffer become empty. Any remaining takers will be then invoked with `END`.


### Buffer

Used to implement the buffering strategy for a channel. The Buffer interface defines 3 methods: 'isEmpty', `put` and `take`

- `isEmpty()`: returns true if there are no messages on the buffer. A channel calls this method whenever a new taker is registered  
- `put(message)`: used to put new message in the buffer. Note the Buffer can chose to not store the message
(e.g. a dropping buffer can drop any new message exceeding a given limit)  
- `take()` used to retrieve any buffered message. Note the behavior of this method has to be consistent with `isEmpty`

### SagaMonitor

Used by the middleware to dispatch monitoring events. Actually the middleware dispatches 4 events:

- When an effect is triggered (via `yield someEffect`) the middleware invokes `sagaMonitor.effectTriggered`  

- If the effect is resolved with success the middleware invokes `sagaMonitor.effectResolved`  

- If the effect is rejected with an error the middleware invokes `sagaMonitor.effectRejected`

- finally is the effect is cancelled the middleware invokes `sagaMonitor.effectCancelled`

Below the signature for each method

- `effectTriggered(options)` : where options is an object with the following fields

  - `effectId` : Number - Unique ID assigned to the yielded effect   

  - `parentEffectId` : Number - ID of the parent Effect. In the case of a `race` or `parallel` effect, all
  effects yielded inside will have the direct race/parallel effect as a parent. In case of a top-level effect, the
  parent will be the containing Saga   

  - `label` : String - In case of a `race` effect, all child effects will be assigned as label the corresponding
  keys of the object passed to `race`

  - `effect` : Object - the yielded effect itself

- `effectResolved(effectId, result)`

    - `effectId` : Number - The ID of the yielded effect

    - `result` : any - The result of the successful resolution of the effect

- `effectRejected(effectId, error)`

    - `effectId` : Number - The ID of the yielded effect

    - `error` : any - Error raised whith the rejection of the effect


- `effectCancelled(effectId)`

    - `effectId` : Number - The ID of the yielded effect


## External API
------------------------

### `runSaga(iterator, options)`

Allows starting sagas outside the Redux middleware environment. Useful if you want to
connect a Saga to external input/output, other than store actions.

`runSaga` returns a Task object. Just like the one returned from a `fork` effect.


- `iterator: {next, throw}` - an Iterator object, Typically created by invoking a Generator function

- `options: Object` - currently supported options are:

  - `subscribe(callback): Function` - A function which accepts a callback and returns an `unsubscribe` function

    - `callback(input): Function` - callback(provided by runSaga) used to subscribe to input events. `subscribe` must support registering multiple subscriptions.
      - `input: any` - argument passed by `subscribe` to `callback` (see Notes below)

  - `dispatch(output): Function` - used to fulfill `put` effects.
    - `output: any` -  argument provided by the Saga to the `put` Effect (see Notes below).

  - `getState(): Function` - used to fulfill `select` and `getState` effects

  - `sagaMonitor` : [SagaMonitor](#sagamonitor) - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)

  - `logger` : `Function` - see docs for [`createSagaMiddleware(options)`](#createsagamiddlewareoptions)

#### Notes

The `{subscribe, dispatch}` is used to fulfill `take` and `put` Effects. This defines the Input/Output
interface of the Saga.

`subscribe` is used to fulfill `take(PATTERN)` effects. It must call `callback` every time it
has an input to dispatch (e.g. on every mouse click if the Saga is connected to DOM click events).
Each time `subscribe` emits an input to its callbacks, if the Saga is blocked on a `take` effect, and
if the take pattern matches the currently incoming input, the Saga is resumed with that input.

`dispatch` is used to fulfill `put` effects. Each time the Saga emits a `yield put(output)`, `dispatch`
is invoked with output.

## Utils

### `channel([buffer])`

A factory method that can be used to create Channels. You can optionnally pass it a buffer
to control how the channel buffers the messages.

By default, if no buffer is provided, the channel will queue all incoming messages until interested takers are registered. The default buffering will deliver message using a FIFO strategy: a new taker will be delivered the oldest message in the buffer.

### `eventChannel(subscribe, [buffer], [matcher])`

Creates channel that will subscribe to an event source using the `subscribe` method. Incoming events from the event source will be queued in the channel until interested takers are registered.

- `subscribe: Function` used to subscribe to the underlying event source. The function must return an unsubscribe function to terminate the subscription.

- `buffer: Buffer` optional Buffer object to buffer messages on this channel. If not provided messages will not buffered
on this channel.

- `matcher: Function` optional predicate function (`any => Boolean`) to filter incoming messages. Only messages accepted by
the matcher will be put on the channel.

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

- `buffers.fixed(limit)`: new messages will be buffered up to `limit`. Overflow will raises an Error. Omitting a `limit` value will result in an unlimited  buffer.

- `buffers.dropping(limit)`: some as `fixed` but Overflow will silently drop the messages.

- `buffers.sliding(limit)`: some as `fixed` but Overflow will insert the new message at the end and drop the oldest message in the buffer.

### `delay(ms, [val])`

Returns a Promise that will resolve after `ms` milliseconds with `val`.
