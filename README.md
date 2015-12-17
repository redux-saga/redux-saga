An alternative Side Effect model for Redux applications. Instead of dispatching thunks
which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side Effects logic in a central place.

This means the logic of the application lives in 2 places

- Reducers are responsible of handling state transitions between actions

- Sagas are responsible of orchestrating complex/asynchronous operations (side effects or actions).
This includes simple side effects which react to one action (e.g. send a request on each button click),
but also complex operations that span across multiple actions (e.g. User onBoarding, Wizard
dialogs, asynchronous Game rules ...).


A Saga is a generator function that takes user actions as inputs and may yield Side Effects
(e.g. server updates, navigation, store actions ...) as output.

- [Getting started](#getting-started)
- [Declarative Effects](#declarative-effects)
- [Error handling](#error-handling)
- [Effect Combinators](#effect-combinators)
- [Sequencing Sagas via yield*](#sequencing-sagas-via-yield)
- [Composing Sagas](#composing-sagas)
- [Cocurrent tasks tasks with fork/join ](#concurrent-tasks-with-forkjoin)
- [Building from sources](#building-from-sources)

#Getting started

Install
```
npm install redux-saga
```

Create the Saga (using the counter example from Redux)
```javascript
import { take, call } from 'redux-saga'
// sagas/index.js
function* incrementAsync() {

  while(true) {

    // wait for each INCREMENT_ASYNC action  
    const nextAction = yield take(INCREMENT_ASYNC)

    // call delay : Number -> Promise
    yield delay(1000)

    // dispatch INCREMENT_COUNTER
    yield put( increment() )
  }

}

export default [incrementAsync]
```

Plug redux-saga in the middleware pipeline
```javascript
// store/configureStore.js
import sagaMiddleware from 'redux-saga'
import sagas from '../sagas'

const createStoreWithSaga = applyMiddleware(
  // ...,
  sagaMiddleware(...sagas)
)(createStore)

export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
```

In the above example we created an `incrementAsync` Saga to handle all `INCREMENT_ASYNC` actions.
The Generator function uses `yield take(action)` to wait asynchronously for the next action.
The middleware handles action queries from the Saga by pausing the Generator until an action matching
the query happens. Then it resumes the Generator with the matching action.

After receiving the wanted action, the Saga triggers a call to `delay(1000)`, which in our example
returns a Promise that will be resolved after 1 second. Again, the middleware will pause the Generator
until the yielded promise is resolved.

After the 1 second delay, the Saga dispatches an `INCREMENT_COUNTER` action using the `put(action)`
function. And as for the 2 precedent statements, the Saga is resumed after resolving the result of the
action dispatch (which will happen immediately if the Store's dispatch function returns a normal value,
but may be later if the dispatch result is a Promise).

The Generator uses an infinite loop `while(true)` which means it will stay alive for all the application
lifetime. But you can also create Sagas that last only for a limited amount of time. For example, the
following Saga will wait for the first 3 `INCREMENT_COUNTER` actions, triggers a `showCongratulation()`
action and then finishes.

```javascript
function* onBoarding() {

  for(let i = 0; i < 3; i++)
    yield take(INCREMENT_COUNTER)

  yield put( showCongratulation() )
}
```

The basic idea, is that you use the `yield` operator every time you want to trigger a Side Effect. So
to be more accurate, A Saga is a Generator function that yields Side Effects, wait for their results
then resume with the responses. Everything you `yield` is considered an Effect: waiting for an action,
triggering a server request, dispatching an action to the store...

#Declarative Effects

Sagas Generators can yield Effects in multiple forms. The simplest way is to yield a Promise

```javascript
function* fetchSaga() {

  // returns a Promise that will resolve with the GET response
  const products = yield fetch('/products')

  // dispatch a RECEIVE_PRODUCTS action
  yield put( receiveProducts(products) )
}
```

In the example above, `fetch('/url')` returns a Promise that will resolve with the GET response. So the 'fetch effect' will be
executed immediately . Simple and idiomatic but ...

Suppose we want to test generator above

```javascript
const iterator = fetchSaga()
assert.deepEqual( iterator.next().value, ?? ) // what do we expect ?
```

We want to check the result of the first value yielded by the generator, which is in our case the result of running
`fetch('/products')`. Executing the real service during tests is not a viable nor a practical approach, so we have to *mock* the
fetch service, i.e. we'll have to replace the real `fetch` method with a fake one which doesn't actually run the
GET request but only checks that we've called `fetch` with the right arguments (`'/products'` in our case).

Mocks makes testing more  difficult and less reliable. On the other hand, functions which returns simple values are
easier to test, we can use a simple `equal()` to check the result.This is the way to write the most reliable tests.

Not convinced ? I encourage you to read this [Eric Elliott' article]
(https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d#.4ttnnzpgc)

>(...)`equal()`, by nature answers the two most important questions every unit test must answer, but most don’t:
- What is the actual output?
- What is the expected output?

>If you finish a test without answering those two questions, you don’t have a real unit test. You have a sloppy, half-baked test.

What we need actually, is just to make sure the `fetchSaga` yields a call with the right function and the right
arguments. For this reason, the library provides some declarative ways to yield Side Effects while still making it
easy to test the Saga logic

```javascript
import { call } from 'redux-saga'

function* fetchSaga() {
  const products = yield call( fetch, '/products' ) // don't run the effect
}
```

We're using now `call(fn, ...args)` function. **The difference from the precedent example is that now we're not
executing the fetch call immediately, instead, `call` creates a description of the effect**. Just as in
Redux you use action creators to create a plain object describing the action that will get executed by the Store,
`io.call` creates a plain object describing the function call. The redux-saga middleware takes care of executing
the function call and resuming the generator with the resolved response.


This allows us to easily test the Generator outside the Redux environment.

```javascript
import { call } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, call(fetch, '/products') // expects a call(...) value
```

Now, we don't need to mock anything, a simple equality test will suffice.

The advantage of declarative effects is that we can test all the logic inside a Saga/Generator
by simply iterating over the resulting iterator and doing a simple equality tests on the values
yielded successively. This is a real benefit, as your complex asynchronous operations are no longer
black boxes, you can test in detail their logic of operation no matter how complex it is.

The `call` method is well suited for functions which return Promise results. Another function
`cps` can be used to handle Node style functions (e.g. `fn(...args, callback)` where `callback`
is of the form `(error, result) => ()`). For example

```javascript
import { cps } from 'redux-saga'

const content = yield cps(readFile, '/path/to/file')
```

and of course you can test it just like you test call

```javascript
import { cps } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, cps(readFile, '/path/to/file') )
```

#Error handling

You can catch errors inside the Generator using the simple try/catch syntax. In the following example,
the Saga catch errors from the `api.buyProducts` call (i.e. a rejected Promise)

```javascript
function* checkout(getState) {

  while( yield take(types.CHECKOUT_REQUEST) ) {
    try {
      const cart = getState().cart
      yield call(api.buyProducts, cart)
      yield put(actions.checkoutSuccess(cart))
    } catch(error) {
      yield put(actions.checkoutFailure(error))
    }
  }
}
```

#Effect Combinators

The `yield` statements are great for representing asynchronous control flow in a simple and linear
style. But we also need to do things in parallel. We can't simply write

```javascript
// Wrong, effects will be executed in sequence
const users  = yield call(fetch, '/users'),
      repose = yield call(fetch, '/repose')
```

Because the 2nd Effect will not get executed until the first call resolves. Instead we have to write

```javascript
import { call, race } from 'redux-saga'

// correct, effects will get executed in parallel
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repose')
]
```

When we yield an array of effects, the Generator is paused until all the effects are resolved (or as soon as
one is rejected, just like specified by the `Promise.all` method).

Sometimes we also need a behavior similar to `Promise.race`:getting the first resolved effect from
multiple ones. The method `io.race` offers a declarative way of triggering a race between effects.

The following shows a Saga that triggers a `showCongratulation` message if the user triggers 3
`INCREMENT_COUNTER` actions with less than 5 seconds between 2 actions.

```javascript
function* onBoarding() {
  let nbIncrements = 0
  while(nbIncrements < 3) {
    // wait for INCREMENT_COUNTER with a timeout of 5 seconds
    const winner = yield race({
      increment : take(INCREMENT_COUNTER),
      timeout   : call(delay, 5000)
    })

    if(winner.increment)
      nbIncrements++
    else
      nbIncrements = 0
  }

  yield put(showCongratulation())
}
```

Note the Saga has an internal state, but that has nothing to do with the state inside the Store,
this is a local state to the Saga function used to control the flow of actions.

If by some means you want to view this state (e.g. shows the user progress) then you have
to move it into the store and create a dedicated action/reducer for it

```javascript
function* onBoarding(getState) {

  while( getState().nbIncrements < 3 ) {
    // wait for INCREMENT_COUNTER with a timeout of 5 seconds
    const winner = yield io.race({
      increment : take(INCREMENT_COUNTER),
      timeout   : call(delay, 5000)
    })

    if(winner.increment)
      yield put( actions.incNbIncrements() )
    else
      yield put( actions.resetNbIncrements() )
  }

  yield put( showCongratulation() )
}
```

#Sequencing Sagas via yield*

You can use the builtin `yield*` operator to compose multiple sagas in a sequential way.
This allows you to sequence your *macro-operations* in a simple procedural style.

```javascript
function* playLevelOne(getState) { ... }

function* playLevelTwo(getState) { ... }

function* playLevelThree(getState) { ... }

function* game(getState) {

  const score1 = yield* playLevelOne(getState)
  put(showScore(score1))

  const score2 = yield* playLevelTwo(getState)
  put(showScore(score2))

  const score3 = yield* playLevelThree(getState)
  put(showScore(score3))

}
```

Note that using `yield*` will cause the JavaScript runtime to *flatten* the whole sequence.
i.e. the resulting iterator (`game()` return value) will yield all values from the nested
iterators. A more powerful alternative is to use the generic middleware composition mechanism.

#Composing Sagas

While using `yield*` provides an idiomatic way of compositing Sagas. The approach has some limits:

- You'll likely to test nested generators separately. This leads to test duplication because when
testing the main generator you'll have to iterate again on all the nested generators. This
can be achieved by making the nested tests reusable but the tests will still take more time to execute.

- More importantly, `yield*` allows only for sequential composition of generators, you can only
yield* to one generator at a time. But there can be use cases when you want to launch multiple
operations in parallel. You spawn multiple Sagas in the background and resumes when all the spawned
Sagas are done.

The Saga middleware offers an alternative way of composition using the simple `yield` statement.

```javascript
function* fetchPosts() {
  yield put( actions.requestPosts() )
  const products = yield call(fetchApi, '/products')
  yield put( actions.receivePosts(products) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield call(fetchPosts)
  }
}
```

When yielding a call to a generator (or directly an iterator with `yield fetchPosts()`) the middleware will
convert the resulting iterator into a promise that will resolve to that sub-iterator return value (or a
rejected with an eventual error thrown from it).

This effectively lets you compose nested generators with other effects, like future actions,
timeouts, ...

For example you may want the user finish some game in a limited amount of time

```javascript
function* game(getState) {

  let finished
  while(!finished) {
    // has to finish in 60 seconds
    const {score, timeout}  = yield race({
      score  : call( play, getState),
      timeout : call(delay, 60000)
    })

    if(!timeout) {
      finished = true
      put( showScore(score) )
    }
  }

}
```

Or you may want to spawn multiple Sagas in parallel to monitor user actions and congratulate
the user when he accomplishes all the desired tasks.

```javascript
function* monitorTask1() {...}
...

function* game(getState) {

  const tasks = yield [ call(monitorTask1), ... ]

  yield put( showCongratulation() )
}
```
#Concurrent tasks with fork/join

the `yield` statement cause the generator to pause until the yielded effect has resolved. If you look
closely at this example

```javascript
function* fetchPosts() {
  yield put( actions.requestPosts() )
  const products = yield call(fetchApi, '/products')
  yield put( actions.receivePosts(products) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield call(fetchPosts)
  }
}
```

the `watchFetch` generator will wait until `yield call(fetchPosts)` terminates. Imagine that the
`FETCH_POSTS` action is fired from an `Refresh` button. If you application disables the button between
each fetch (no concurrent fecth) then there is no issue;

Now imagine the application allows the user to click on `Refresh` without waiting for the current request
to terminate; what will happen is that `watchFetch` will not notice the `FETCH_POSTS` actions which
occurs while it's waiting for the current `fetchPosts` task to terminate.

We can use the `fork` method hat to start the `fetchPosts` task but without actually waiting for it.

```javascript
import { fork } from 'redux-saga'
...

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield fork(fetchPosts)
  }
}
```

`fork` starts a new task and returns immediately, so now we won't miss any action. But, since a
`yield fork(...)` doesn't wait for the future result what's its return value ?

the answer is a *Task*

```javascript
// non blocking call
const task = yield fork(...)
```

As common use case for tasks, let's look more closely at our previous example. We are now starting
multiple `fetchPosts` concurrently, what happens if those concurrent tasks terminate with *an arbitrary order* ?
I mean, what if the responses arrive in a different order than in which they were started. The `receiveProducts`
 action will be fired in the same arbitrary order, so the UI could be refreshed with an outdated response.

What we'd really like is to update the UI with response from the latest request; the user will also
likely expect the last click on `Refresh` to retrieve the latest data from the server. So how do we
solve this problem ?

A possible solution is to delay triggering the `receiveProducts` until the last fetch terminates so we'll
update the UI only if there is no a pending fetch

```javascript
function* watchFetch() {

  let lastTaskId = 0
  while ( yield take(FETCH_POSTS) ) {
    yield put( actions.requestPosts() )
    yield fork(fetchPosts, ++lastTaskId)    
  }

  function* fetchPosts(taskId) {
    const posts = yield call(fetchApi, '/posts')
    if(taskId === lastTaskId)
      yield put( actions.receivePosts() )
  }
}
```

Athough we start tasks and let them go, we can *join* their results at later point.

```javascript
// non blocking call
const task = yield fork(...)

// ... later
// now a blocking call
const result = yield join(...)
```


#Building from sources

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

There are 2 examples ported from the Redux repos

Counter example
```
// build the example
npm run build-counter

// test sample for the generator
npm run test-counter
```

Shopping Cart example
```
// build the example
npm run build-shop

// test sample for the generator
npm run test-shop
```
