# Troubleshooting

### App freezes after adding a saga

Make sure that you `yield` the effects from the generator function.

Consider this example:

```js
import { take } from 'redux-saga/effects'

function* logActions() {
  while (true) {
    const action = take() // wrong
    console.log(action)
  }
}
```

It will put the application into an infinite loop because `take()` only creates a description of the effect. Unless you `yield` it for the middleware to execute, the `while` loop will behave like a regular `while` loop, and freeze your application.

Adding `yield` will pause the generator and return control to the Redux Saga middleware which will execute the effect. In case of `take()`, Redux Saga will wait for the next action matching the pattern, and only then will resume the generator.

To fix the example above, simply `yield` the effect returned by `take()`:

```js
import { take } from 'redux-saga/effects'

function* logActions() {
  while (true) {
    const action = yield take() // correct
    console.log(action)
  }
}
```

### My Saga is missing dispatched actions when using mulitple `yield* takeEvery/yield* takeLatest`

You're likely running mulitple `yield*` statements inside the same Saga

```javascript
function* mySaga() {
  yield* takeEvery(ACTION_1, doSomeWork)
  yield* takeEvery(ACTION_2, doSomeWork)
}
```

Instead you'll either have to run them in different Sagas. Or run them in parallel using
`yield [...]` (without the `*`)

```javascript
function* mySaga() {
  yield [
    takeEvery(ACTION_1, doSomeWork),
    takeEvery(ACTION_2, doSomeWork)
  ]
}
```

### Explication

`yield*` is used to *delegate* control to other iterators. In the above example, the first
`takeEvery(ACTION_1, doSomeWork)` returns an iterator object. Combined with `yield*` the `mySaga`
generator will delegate all its `next()` calls to the returned iterator. This means any call to
`next()` of `mySaga` will forward to `next()` of the `takeEvery(...)` iterator. And only after the
the `takeEvery(...)` iterator is done, the call to the second `yield* takeEvery(ACTION_2, doSomeWork)`
will proceed (since `takeEvery(...)` is executing a `while(true) {...}` under the hoods. The
first iterator will never terminate so the second call will never proceed).

With the parallel form `yield [takeEvery(...), ...]` The middleware will run all the returned
iterators in parallel.

### My Saga is missing dispatched actions

Make sure the Saga is not blocked on some effect. When a Saga is waiting for an Effect to
resolve, it will not be able to take dispatched actions until the Effect is resolved.

For example, consider this example

```javascript
function watchRequestActions() {
  while(true) {
    const {url, params} = yield take('REQUEST')
    yield call(handleRequestAction, url, params) // The Saga will block here
  }
}

function handleRequestAction(url, params) {
  const response = yield call(someRemoteApi, url, params)
  yield put(someAction(response))
}
```

When `watchRequestActions` performs `yield call(handleRequestAction, url, params)`, it'll wait
for `handleRequestAction` until it terminates an returns before continuing on the next
`yield take`. For example suppose we have this sequence of events

```
UI                     watchRequestActions             handleRequestAction  
-----------------------------------------------------------------------------
.......................take('REQUEST').......................................
dispatch(REQUEST)......call(handleRequestAction).......call(someRemoteApi)... Wait server resp.
.............................................................................   
.............................................................................
dispatch(REQUEST)............................................................ Action missed!!
.............................................................................   
.............................................................................
.......................................................put(someAction).......
.......................take('REQUEST')....................................... saga is resumed
```

As illustrated above, when a Saga is blocked on a **blocking call** the it will miss
all the actions dispatched in-between.

To avoid blocking the Saga, you can use a **non-blocking call** using `fork` instead of `call`

```javascript
function watchRequestActions() {
  while(true) {
    const {url, params} = yield take('REQUEST')
    yield fork(handleRequestAction, url, params) // The Saga will resume immediately
  }
}
```

#### The `put` effect is also a blocking call

It's important to know is that the `put` effect is dispatched asynchronously in a microtask
(you'll see why shortly). i.e. The put is executed by the middleware using something like this

```javascript
function runPutEffect(action) {
  Promise.resolve().then(() => dispatch(action))
}
```

what that means in your code is that `yield put(action(...))` is not executed right away but
scheduled in a microtask. so the current flow will first terminate (e.g. the code dispatching
the action to the Saga) then the dispatch will be executed.

Typically you'll be exposed to this issue only on rare occasions. like when a sequence of take/put
actions leads to nested dispatches (dispatching in the middle of an alreay running dispatch). For
[a typical case see this issue](https://github.com/yelouafi/redux-saga/issues/198)

### I'm Observing significant performance issues when dispatching actions

Multiple Monitoring events are dispatched when the app is executed on developpement mode.
Running the application in Production mode will likely solve the issue.
