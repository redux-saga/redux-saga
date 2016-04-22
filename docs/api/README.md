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
  * [`actionChannel(pattern, [buffer])`](#actionchannelpatternbuffer)
  * [`cancelled()`](#cancelled)
* [`Effect combinators`](#effect-combinators)
  * [`race(effects)`](#raceeffects)
  * [`[...effects] (aka parallel effects)`](#effects-parallel-effects)
* [`Interfaces`](#interfaces)
  * [`Task`](#task)
  * [`Channel`](#channel)
  * [`Buffer`](#buffer)
  * `SagaMonitor`
* [`External API`](#external-api)
  * [`runSaga(iterator, {subscribe, dispatch, getState}, [monitor])`](#runsagaiterator-subscribe-dispatch-getstate-monitor)
* 'Utils'
  * [`channel([buffer])`](#channelbuffer)
  * [`eventChannel(subscribe, buffer)`](#eventchannelsubscribebuffer)
  * [`buffers`](#buffers)
  * [`delay(ms, val)`](#delay)


## Middleware API
------------------------

### `createSagaMiddleware(options)`

Creates a Redux middleware and connects the Sagas to the Redux Store

- `options: Object` - A list of options to pass to the middleware. For now there is only
one supported options: `sagaMonitor` which indicates a [SagaMonitor](#sagamonitor). If a Saga
Monitor is provided, the middleware will deliver monitoring events to the monitor.

#### Example

Below we will create a function `configureStore` which will enhance the Store with a new method
`runSaga`. Then in our main module, we will use the method to start the root Saga of the application

**configureStore.js**
```JavaScript
import createSagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  const sagaMiddleware = createSagaMiddleware()
  return {
    ...createStore(reducer, initialState, applyMiddleware(/* other middleware, */sagaMiddleware),
    runSaga: sagaMiddleware.run
  )
}
```

**main.js**
```javascript
import configureStore from './configureStore'
import rootSaga from './sagas'
//... other imports

const store = configureStore()
store.runSaga(rootSaga)
```

#### Notes

see blow for more informations on the `sagaMiddleware.run` method


### `middleware.run(saga, ...args)`

Dynamically run `saga`. Can be used to run Sagas **only after** the `applyMiddleware` phase

- `saga: Function`: A Generator function  
- `args: Array<any>`: arguments to be provided to `saga` (in addition to Store's `getState`)

The method returns a [Task descriptor](#task-descriptor)

#### Notes

`saga` must be a function which returns a [Generator Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator).
The middleware will then iterate over the Generator and execute all yielded Effects.

`saga` may also start other sagas using the various Effects provided by the library. The iteration process
process described below is also applied to all child sagas.

In the first iteration, the middleware invokes the `next()` method to retrieve the next Effect. The
middleware then executes the yielded Effect as specified by the Effects API below. Meanwhile, the Generator
will be suspended until the effect execution terminates. Upon receiving
the result of the execution, the middleware calls `next(result)` on the Generator passing it the retrieved
result as argument. This process is repeated until the Generator terminates normally or by throwing some error.

If the execution results in an error (as specified by each Effect creator) then the
`throw(error)` method of the Generator is called instead. If the Generator function defines
a `try/catch` surrounding the current yield instruction, then the `catch` block will be invoked
by the underlying Generator runtime. The runtime will also invoke any corresponding finally block.

In the case a Saga is cancelled (either manually or using the provided Effects), the middleware will
invoke `return()` method of the Generator. This will cause the Generator to skip directly to the finally
block.

## Saga Helpers
--------------------------

>#### Notes, the following functions are helper functions built on top of the Effect creators
below

### `takeEvery(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`

Each time an action is dispatched to the store. And if this action matches `pattern`, `takeEvery`
starts a new `saga` task in the background.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeEvery` will add the
incoming action to the argument list (i.e. the action will be the last argument provided to `saga`)

#### Example

In the following example, we create a simple task `fetchUser`. We use `takeEvery` to
start a new `fetchUser` task on each dispatched `USER_REQUESTED` action

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

`takeEvery` is a high level API built using `take` and `fork`. Here is how the helper is implemented

```javascript
function* takeEvery(pattern, saga, ...args) {
  while(true) {
    const action = yield take(pattern)
    yield fork(saga, ...args.concat(action))
  }
}
```

`takeEvery` allows concurrent actions to be handled. In the exmaple above, when a `USER_REQUESTED`
action is dispatched, a new `fetchUser` task is started even if a previous `fetchUser` is still pending
(for example, the user clicks on a `Load User` button 2 consecutive times at a rapid rate, the 2nd
click will dispatch a `USER_REQUESTED` action while the `fetchUser` fired on the first one hasn't yet terminated)

`takeEvery` doesn't handle out of order responses from tasks. There is no guarantee that the tasks will
termiate in the same order they were started. To handle out of order responses, you may consider `takeLatest`
below

### `takeLatest(pattern, saga, ...args)`

Spawns a `saga` on each action dispatched to the Store that matches `pattern`. And automatically cancels
any previous `saga` task started previous if it's still running.

Each time an action is dispatched to the store. And if this action matches `pattern`, `takeLatest`
starts a new `saga` task in the background. If a `saga` task was started previously (on the last action dispatched
before the actual action), and if this task is still running, the task will be cancelled by throwing
a `SagaCancellationException` inside it.

- `pattern: String | Array | Function` - for more information see docs for [`take(pattern)`](#takepattern)

- `saga: Function` - a Generator function

- `args: Array<any>` - arguments to be passed to the started task. `takeEvery` will add the
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

`takeLatest` is a high level API built using `take` and `fork`. Here is how the helper is implemented

```javascript
function* takeLatest(pattern, saga, ...args) {
  let lastTask
  while(true) {
    const action = yield take(pattern)
    if(lastTask)
      yield cancel(lastTask) // cancel is no-op if the task has already terminateds

    lastTask = yield fork(saga, ...args.concat(action))
  }
}
```

## Effect creators
-------------------------

>#### Notes
Each function below returns a plain JavaScript object and do not perform any execution
The execution is performed by the middleware during the Iteration process described above.
The middleware examines each Effect description and performs the appropriate action.

### `take(pattern)`

Creates an Effect description that instructs the middleware to wait for a specified action on the Store.
The Generator is suspended until an action that matches `pattern` is dispatched.

`pattern` is interpreted using the following rules:

- If `take` is called with no arguments or `'*'` all dispatched actions are matched (e.g. `take()` will match all actions)

- If it is a function, the action is matched if `pattern(action)` is true (e.g. `take(action => action.entities)`
will match all actions having a (truthy) `entities`field.)

- If it is a String, the action is matched if `action.type === pattern` (e.g. `take(INCREMENT_ASYNC)`

- If it is an array, `action.type` is matched against all items in the array (e.g. `take([INCREMENT, DECREMENT])` will
match either actions of type `INCREMENT` or `DECREMENT`).

The middleware provides a special action `END`. If you dispatch the END action, then all Sagas blocked on a take Effect
will be terminated regardless of the specified pattern. If the terminated Saga has still some forked tasks which are still
running, it will wait for all the child tasks to terminate before terminating the Task.

### `takem(pattern)`

Same as `take(pattern)` but does not automatically terminate the Saga on an `END` action. Instead all Sagas blocked on a take
Effect will get the `END` object

### `take(channel)`

Creates an Effect description that instructs the middleware to wait for a specified message from the provided Channel. If the channel
is already closed, then the Generator will immediately terminate following the same process described above for `take(pattern)`.

### `takem(channel)`

Same as `take(channel)` but does not automatically terminate the Saga on an `END` action. Instead all takers are resumed with `END`

### `put(action)`

Creates an Effect description that instructs the middleware to dispatch an action to the Store.


- `action: Object` - [see Redux `dispatch` documentation for complete infos](http://redux.js.org/docs/api/Store.html#dispatch)


### `put(channel, action)`

Creates an Effect description that instructs the middleware to put an action into the provided channel.


- `channel: Channel` - a [`Channel`](#channel) Object.
- `action: Object` - [see Redux `dispatch` documentation for complete infos](http://redux.js.org/docs/api/Store.html#dispatch)


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

Some as `call(fn, ...args)` but supports passing a `this` context to `fn`. This is useful to
invoke object methods.

### `apply(context, fn, args)`

Alias for `call([context, fn], ...args)`

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

Creates an Effect description that instructs the middleware to perform a *non blocking call* on `fn`

#### Arguments

- `fn: Function` - A Generator function, or normal function which returns a Promise as result

- `args: Array<any>` - An array of values to be passed as arguments to `fn`

#### Note

`fork`, like `call`, can be used to invoke both normal and Generator functions. But, the calls are
non blocking, the middleware doesn't suspend the Generator while waiting for the result of `fn`.
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

### `fork([context, fn], ...args)`

Supports spawning functions with a `this` context

### `join(task)`

Creates an Effect description that instructs the middleware to wait for the result
of a previously forked task.

- `task: Task` - A [Task](#task) object returned by a previous `fork`

### `cancel(task)`

Creates an Effect description that instructs the middleware to cancel a previously forked task.

- `task: Task` - A [Task](#task) object returned by a previous `fork`

#### Notes

To cancel a running Generator, the middleware will throw a `SagaCancellationException` inside
it.

Cancellation propagates downward. When cancelling a Generator, the middleware will also
cancel the current Effect where the Generator is currently blocked. If the current Effect
is a call to another Generator, then the Generator will also be cancelled.

A cancelled Generator can catch `SagaCancellationException`s in order to perform some cleanup
logic before it terminates (e.g. clear a `isFetching` flag in the state if the Generator was
in middle of an AJAX call).

*Note that uncaught `SagaCancellationException`s are not bubbled upward, if a Generator
doesn't handle cancellation exceptions, the exception will not bubble to its parent
Generator.

`cancel` is a non blocking Effect. i.e. the Generator will resume immediately after
throwing the cancellation exception.

For functions which return Promise results, you can plug your own cancellation logic
by attaching a `[CANCEL]` to the promise.

The following example shows how to attach cancellation logic to a Promise result :

```javascript
import { fork, cancel, CANCEL } from 'redux-saga/effects'

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

>It's important to note that when an action is dispatched to the store. The middleware first
forwards the action to the reducers then notifies the Sagas. It means that when you query the
Store's State, you get the state **after** the action has been applied

#### Notes

Preferably, a Saga should be autonomous and should not depend on the Store's state. This makes
it easy to modify the state implementation without affecting the Saga code. A saga should preferably
depend only on its own internal control state when possible. But sometimes, one could
find it more convenient for a Saga to query the state instead of maintaining the needed data by itself
(for example, when a Saga duplicates the logic of invoking some reducer to compute a state that was
already computed by the Store).

Normally, *top Sagas* (Sagas started by the middleware) are passed the Store's `getState` method
which allows them to query the current Store's state. But the `getState` function must be
passed around in order for *nested Sagas* (child Sagas started from inside other Sagas)
to access the state.

for example, suppose we have this state shape in our application

```javascript
state = {
  cart: {...}
}
```

And then we have our Sagas like this

`./sagas.js`
```javascript
import { take, fork, ... } from 'redux-saga/effects'

function* checkout(getState) {
  // must know where `cart` is stored
  const cart = getState().cart

  // ... call some Api endpoint then dispatch a success/error action
}

// rootSaga automatically gets the getState param from the middleware
export default function* rootSaga(getState) {
  while(true) {
    yield take('CHECKOUT_REQUEST')

    // needs to pass the getState to child Saga
    yield fork(checkout, getState)
  }
}
```

One problem with the above code, besides the fact that `getState` needs to be passed
explicitly down the call/fork chain, is that `checkout` must know where the `cart`
slice is stored within the global State atom (e.g. in the `cart` field). The Saga is now coupled
with the State shape. If that shape changes in the future (for example  via some
normalization process) then we must also take care to change the code inside the
`checkout` Saga. If we have other Sagas that also access the `cart` slice, then this can
cause some subtle errors in our application if we forget to update one of the dependent
Sagas.

To alleviate this, we can create a *selector*, i.e. a function which knows how to extract
the `cart` data from the State

`./selectors`
```javascript
export const getCart = state => state.cart
```

Then we can use that selector from inside the `checkout` Saga

`./sagas.js`
```javascript
import { take, fork, select } from 'redux-saga/effects'
import { getCart } from './selectors'

function* checkout() {
  // query the state using the exported selector
  const cart = yield select(getCart)

  // ... call some Api endpoint then dispatch a success/error action
}

export default function* rootSaga() {
  while(true) {
    yield take('CHECKOUT_REQUEST')

    // No more need to pass the getState param
    yield fork(checkout)
  }
}
```

First thing to note is that `rootSaga` doesn't use the `getState` param. There is
no need for it to pass `getState` to the child Saga. `rootSaga` no longer have to make
assumptions about `checkout` (i.e. whether `checkout` needs to access the state or not).

Second thing is that `checkout` can now get the needed information directly by using
`select(getCart)`. The Saga is now coupled only with the `getCart` selector. If we have
many Sagas (or React Components) that needs to access the `cart` slice, they will all be
coupled to the same function `getCart`. And if we now change the state shape, we need only
to update `getCart`.

### `actionChannel(pattern, [buffer])`

Creates an effect that instructs the middleware to queue the actions matching `pattern` using an event channel.
Optionnally you can provide a buffer
to control buffering of the queued actions.

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
  while(true) {
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
    if(yield cancelled()) {
      // logic that should execute only on Cancellation
    }
    // logic that should execute in all situations (e.g. closing a channel)
  }
}
```

## Effect combinators
----------------------------

### `race(effects)`

Creates an Effect description that instructs the middleware to run a *Race* between
multiple Effects (this is similar to how `Promise.race([...])` behaves).

`effects: Object` - a dictionary Object of the form {label: effect, ...}

#### Example

The following example run a race between 2 effects :

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

The following example run 2 blocking calls in parallel :

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

When running Effects in parallel, the middleware suspends the Generator until one
of the followings :  

- All the Effects completed with success: resumes the Generator with an array containing
the results of all Effects.

- One of the Effects was rejected before all the effects complete: throw the rejection
error inside the Generator.

## Interfaces
---------------------

### Task

The Task interface specifies the result of running a Saga using `fork`, `middleware.run` or `runSaga`


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

A channel is an object used to send and receive messages between tasks. Messages from senders are queued until
an interested receiver request a message, and registered receiver is queued until a message is disponible.

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

`Channel.close():` closes the channel which means no more puts will be allowed. If there are pending takers and no
buffered messages, then all takers will be invoked with `END`. If there are buffered messages, then thoses messages will
be delivered first to takers until the buffer become empty. Any remaining takers will be then invoked with `END`.


### Buffer

Used to implement the buffering strategy for a channel. The Buffer interface defines 3 methods: 'isEmpty', `put` and `take`

- `isEmpty()`: returns true if there are no messages on the buffer. A channel calls this method whenever a new taker is registered  
- `put(message)`: used to put new message in the buffer. Note the Buffer can chose to not store the message
(e.g. a dropping buffer can drop any new message exceeding a given limit)  
- `take()` used to retrieve any buffered message. Note the behavior of this method has to be consistent with `isEmpty`


## External API
------------------------

### `runSaga(iterator, {subscribe, dispatch, getState}, [monitor])`

Allows starting sagas outside the Redux middleware environment. Useful if you want to
connect a Saga to external input/output, other than store actions.

`runSaga` returns a Task object. Just like the one returned from a `fork` effect.


- `iterator: {next, throw}` - an Iterator object, Typically created by invoking a Generator function

- `{subscribe, dispatch, getState}: Object` - an Object which exposes `subscribe`, `dispatch` and `getState` methods

  - `subscribe(callback): Function` - A function which accepts a callback and returns an `unsubscribe` function

    - `callback(input): Function` - callback(provided by runSaga) used to subscribe to input events. `subscribe` must support registering multiple subscriptions.
      - `input: any` - argument passed by `subscribe` to `callback` (see Notes below)

    - `dispatch(output): Function` - used to fulfill `put` effects.
      - `output : any` -  argument provided by the Saga to the `put` Effect (see Notes below).

    - `getState() : Function` - used to fulfill `select` and `getState` effects

- `monitor(sagaAction): Function` (optional): a callback which is used to dispatch all Saga related events. In the middleware version, all actions are dispatched to the Redux store. See the [sagaMonitor example](https://github.com/yelouafi/redux-saga/tree/master/examples/sagaMonitor) for usage.
  - `sagaAction: Object` - action dispatched by Sagas to notify `monitor` of Saga related events.

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
------------

### `channel([buffer])`

A factory method that can be used to create Channels. You can optionnally pass it a buffer
to control how the channel buffers the messages.

By default, if no buffer is provided, the channel will queue all incoming messages until interested takers are registered.
The default buffering will deliver message using a FIFO strategy: a new taker will be delivered the oldest message in the buffer.

### `eventChannel(subscribe, [buffer])`

Creates channel that will subscribe to an event source using the `subscribe` method. Incoming events from the
event source will be queued in the channel until interested takers are registered.

- `subscribe: Function` used to subscribe to the underlying event source. The function must return an unsubscribe function
to terminate the subscription.

To notify the channel that the event source has terminated, you can notify the provided subscriber with an `END`

#### Example

In the following example we create an event channel that will subscribe to a `setInterval`

```javascript
const countdown = (secs) => {
  return eventChannel(listener => {
      const iv = setInterval(() => {
        console.log('countdown', secs)
        secs -= 1
        if(secs > 0)
          listener(secs)
        else {
          listener(END)
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

- `buffers.fixed([limit])`: new messages will be buffered up to `limit`. Overflow will raises an Error.

- `buffers.dropping([limit])`: some as `fixed` but Overflow will silently drop the messages.

- `buffers.sliding([limit])`: some as `fixed` but Overflow will insert the new message at the end and drop the oldest message in the buffer.

### `delay(ms, [val])`

  returns a Promise that will resolve after `ms` milliseconds with `val`
