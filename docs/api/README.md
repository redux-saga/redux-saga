# API Reference

* [`Middleware API`](#middleware-api)
  * [`createSagaMiddleware(...sagas)`](#createsagamiddlewaresagas)
  * [`middleware.run(saga, ...args)`](#middlewarerunsaga-args)
* [`Saga Helpers`](#saga-helpers)
  * [`takeEvery(pattern, saga, ...args)`](#takeeverypattern-saga-args)
  * [`takeLatest(pattern, saga, ..args)`](#takelatestpattern-saga-args)
* [`Effect creators`](#effect-creators)
  * [`take(pattern)`](#takepattern)
  * [`put(action)`](#putaction)
  * [`call(fn, ...args)`](#callfn-args)
  * [`call([context, fn], ...args)`](#callcontext-fn-args)
  * [`apply(context, fn, args)`](#applycontext-fn-args)
  * [`cps(fn, ...args)`](#cpsfn-args)
  * [`cps([context, fn], ...args)`](#cpscontext-fn-args)
  * [`fork(fn, ...args)`](#forkfn-args)
  * [`fork([context, fn], ...args)`](#forkcontext-fn-args)
  * [`join(task)`](#jointask)
  * [`cancel(task)`](#canceltask)
  * [`select(selector, ...args)`](#selectselector-args)
* [`Effect combinators`](#effect-combinators)
  * [`race(effects)`](#raceeffects)
  * [`[...effects] (aka parallel effects)`](#effects-parallel-effects)
* [`Interfaces`](#interfaces)
  * [`Task`](#task)
* [`External API`](#external-api)
  * [`runSaga(iterator, {subscribe, dispatch, getState}, [monitor])`](#runsagaiterator-subscribe-dispatch-getstate-monitor)


## Middleware API
------------------------

### `createSagaMiddleware(...sagas)`

Creates a Redux middleware and connects the Sagas to the Redux Store

- `sagas: Array<Function>` - A list of Generator functions

#### Example

```JavaScript
import createSagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'
import sagas from './path/to/sagas'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  return createStore(
    reducer,
    initialState,
    applyMiddleware(/* other middleware, */createSagaMiddleware(...sagas))
  )
}

```

#### Notes

Each Generator functions in `sagas` is invoked by the middleware with `getState`
method of the Redux Store as a first argument.

Each function in `sagas` must return a [Generator Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator).
The middleware will then iterate over the Generator and execute all yielded Effects.

In the first iteration, the middleware invokes the `next()` method to retrieve the next Effect. The
middleware then executes the yielded Effect as specified by the Effects API below. Meanwhile, the Generator
will be suspended until the effect execution terminates. Upon receiving
the result of the execution, the middleware calls `next(result)` on the Generator passing it the retrieved
result as argument. This process is repeated until the Generator terminates normally or by throwing some error.

If the execution results in an error (as specified by each Effect creator) then the
`throw(error)` method of the Generator is called instead. If the Generator function defines
a `try/catch` surrounding the current yield instruction, then the `catch` block will be invoked
by the underlying Generator runtime.

### `middleware.run(saga, ...args)`

Dynamically run `saga`. Can be used to run Sagas after the `applyMiddleware` phase

- `saga: Function`: A Generator function  
- `args: Array<any>`: arguments to be provided to `saga` (in addition to Store's `getState`)

The method returns a [Task descriptor](#task-descriptor)

#### Notes

In some use cases, like in large applications using code splitting (modules are loaded
in demand from the server), or in server side environments, it may be desirable or even
necessary to start Sagas after the `applyMiddleware` phase has completed.

When you create a middleware instance

```javascript
import createSagaMiddleware from 'redux-saga'
import startupSagas from './path/to/sagas'

// middleware instance
const sagaMiddleware = createSagaMiddleware(...startupSagas)
```

The middleware instance exposes a `run` method. You can use this method to run Sagas and
connect them to the Store at a later point in time.

The Saga will be provided `getState` method of the store as the first argument. If `run`
was provided with a non empty `...args`. All elements of `args` will be passed to `saga`
as additional parameters.

#### Example

This example exports the Saga middleware from `configureStore.js`. Then imports
it from `someModule`. `someModule` dynamically loads a Saga from the server, then
use the `run` method of the imported middleware to run the loaded Saga.

##### `configureStore.js`

```javascript
import createSagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'
import startupSagas from './path/to/sagas'

export const sagaMiddleware = createSagaMiddleware(...startupSagas)

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  return createStore(
    reducer,
    initialState,
    applyMiddleware(/* other middleware, */, sagaMiddleware)
  )
}
```

##### `someModule.js`

```javascript
import { sagaMiddleware } from './configureStore'

require.ensure(["dynamicSaga"], (require) => {
    const dynamicSaga = require("dynamicSaga");
    const task = sagaMiddleware.run(dynamicSaga)
});
```

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
      yield cancel(lastTask) // cancel is no-op if the task has alerady terminateds

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


### `put(action)`

Creates an Effect description that instructs the middleware to dispatch an action to the Store.


- `action: Object` - [see Redux `dispatch` documentation for complete infos](http://redux.js.org/docs/api/Store.html#dispatch)

#### Notes

The `put` effect is run asynchronously, i.e. as a separate microtask and thus does not happen immediately. 


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
methods and properties



### `fork([context, fn], ...args)`

Supports invoking forked functions with a `this` context

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
