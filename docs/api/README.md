# API Reference

* [`Middleware API`](#middleware-api)
  * [`sagaMiddleware(...sagas)`](#sagamiddlewaresagas)
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
* [`Effect combinators`](#effect-combinators)
  * [`race(effects)`](#raceeffects)
  * [`[...effects] (aka parallel effects)`](#effects-aka-parallel-effects)
* [`runSaga(generator, {subscribe, dispatch}, [monitor])`](#runsagagenerator-subscribe-dispatch-monitor)

## Middleware API

### `sagaMiddleware(...sagas)`

Creates a Redux middleware which can be mounted on a Redux Store using `applyMiddleware` Redux API

- `sagas: Array<Function>` - A list of Generator functions

#### Example

```JavaScript
import sagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'
import sagas from './path/to/sagas'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  return createStore(
    reducer,
    initialState,
    applyMiddleware(/* other middleware, */sagaMiddleware(...sagas))
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



## Effect creators

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
of a successful result. If `fn` encounters some error, then it must call `fn(error)` in order to
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

The result of `yield fork(fn ...args)` is a *Task descriptor*.  An object with some useful
methods and properties

<table>
  <tr>
    <th>method</th>
    <th>return value</th>
  </tr>
  <tr>
    <td>task.isRunning()</td>
    <td>true if the task hasn't yet returned or throwed an error</td>
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
      a Promise which is either
        <ul>
          <li>resolved with task's return value</li>
          <li>rejected with task's thrown error</li>
        </ul>
      </td>
  </tr>
</table>


### `fork([context, fn], ...args)`

Supports invoking forked functions with a `this` context

### `join(task)`

Creates an Effect description that instructs the middleware to wait for the result
of a previously forked task.

- `task: Object`: A Task Descriptor returned by a previous `fork`

### `cancel(task)`

Creates an Effect description that instructs the middleware to cancel a previously forked task.

- `task: Object`: A Task Descriptor returned by a previous `fork`

#### Notes

To cancel a running Generator, the middleware will throw a `SagaCancellationException` inside
it.

Cancellation propagates downward. When canacelling a Generator, the middleware will also
cancel the current Effect where the Generator is currently blocked. If the current Effect
is a call to another Generator, then the Generator will also be cancelled.

A cancelled Generator can catch `SagaCancellationException`s in order to

*Note that uncaught SagaCancellationException are not bubbled upward, if a Generator
doesn't handle cancellation exceptions, the exception will not bubble to its parent
Generators.

`cancel` is a non blocking Effect. i.e. the Generator will resume immediately after
throwing the cancellation exception.

For functions which return Promise results, you can plug your own cancellation logic
by attaching a `[CANCEL]` to the promise

The following example, shows how to attach cancellation logic to a Promise result

```javascript
import { fork, cancel, CANCEL } from 'redux-saga'

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

## Effect combinators

### `race(effects)`

Creates an Effect description that instructs the middleware to run a *Race* between
multiple Effects (this is similar to how `Promise.race([...])` behaves).

`effects: Object` - a dictionary Object of the form {label: effect, ...}

#### Example

The following example run a race between 2 effects

1- A call to a function `fetchUsers` which returns a Promise
2- A `CANCEL_FETCH` action which may be eventually dispatched on the Store

```javascript
import { take, call } from `redux-saga`
import fetchUsers from './path/to/fetchUsers'

function* fetchUsersSaga {
  const {response, cancel } = yield race({
    result: call(fetchUsers),
    take: (CANCEL_FETCH)
  })
}
```

If `call(fetchUsers)` resolves (or rejects) first, the result of `race` will be an object
with a single keyed object `{response: result}` where `result` is the resolved result of `fetchUsers`

If an action of type `CANCEL_FETCH` is dispatched on the Store before `fetchUsers` completes, the result
will be a single keyed object `{cancel: action}`, where action is the dispatched action.

#### Notes

When resolving a `race`, the middleware automatically cancels all the loosing Effect.


### `[...effects] (parallel effects)`

Creates an Effect description that instructs the middleware to run multiple Effects
in parallel and wait for all of them to complete

#### Example

The following example run 2 blocking calls in parallel

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
of the followings

- All the Effects completed with success: resumes the Generator with an array containing
the results of all Effects.

- One of the Effects was rejected before all the effects complete: throw the rejection
errro inside the Generator.

## External API

### `runSaga(generator, {subscribe, dispatch}, [monitor])`

TBD
