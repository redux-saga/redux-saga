# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

An alternative Side Effect model for Redux applications. Instead of dispatching thunks
which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side Effects logic in a central place.

This means the logic of the application lives in 2 places

- Reducers are responsible of handling state transitions between actions

- Sagas are responsible of orchestrating complex/asynchronous operations.

Sagas are created using Generator functions.

>This middleware is not only about handling asynchronous flow. If all what matters is simplifying
asynchronous control flow, one could simply use async/await functions with some promise middleware.

What this middleware proposes is

- A composable abstraction **Effect**: waiting for an action, triggering State updates (by dispatching
  actions to the store), calling a remote service are all different forms of Effects. A Saga composes those
  Effects using familiar control flow constructs (if, while, for, try/catch).

- The Saga is itself an Effect. It can be combined with other Effects using combinators.
It can also be called from inside other Sagas, providing the full power of Subroutines and
[Structured Programming](https://en.wikipedia.org/wiki/Structured_programming)

- Effects may be yielded declaratively. You yield a description of the Effect which will be
executed by the middleware. This makes your operational logic inside Generators fully testable.

- You can implement complex operations with logic that spans across multiple actions (e.g. User onBoarding, Wizard
dialogs, complex Game rules ...), which are not trivial to express using other effects middlewares.


- [Getting started](#getting-started)
- [How is this different from other asynchronous middlewares](#how-is-this-different-from-the-others)
- [Declarative Effects](#declarative-effects)
- [Error handling](#error-handling)
- [Effect Combinators](#effect-combinators)
- [Sequencing Sagas via yield*](#sequencing-sagas-via-yield)
- [Composing Sagas](#composing-sagas)
- [Non blocking calls with fork/join](#non-blocking-calls-with-forkjoin)
- [Building examples from sources](#building-examples-from-sources)

#Getting started

Install
```
npm install redux-saga
```

Create the Saga (using the counter example from Redux)
```javascript
import { take, put } from 'redux-saga'
// sagas/index.js

function* incrementAsync() {

  while(true) {

    // wait for each INCREMENT_ASYNC action  
    const nextAction = yield take(INCREMENT_ASYNC)

    // delay is a sample function
    // return a Promise that resolves after (ms) milliseconds
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

#How is this different from the others

In the previous example we created an `incrementAsync` Saga. The call `yield take(action)` is a
typical illustration of how Sagas work.

Typically, actual middlewares handle some Effect form triggered by an Action Creator. For example,
redux-thunk handles *thunks* by calling them with `(getState, dispatch)` as arguments,
redux-promise handles Promises by dispatching their resolved values. redux-gen handles generators by
dispatching all yielded actions to the store. The common thing that all those middlewares share is the
same 'call on each action' pattern. They will be called again and again each time an action happens,
i.e. they are *scoped* by the *root action* that triggered them.

Sagas work differently, they are not fired from within Action Creators but are started with your
application and choose what user actions to watch. They are like daemon tasks that run in
the background and choose their own logic of progression. In the example above, `incrementAsync` *pulls*
the `INCREMENT_ASYNC` action using `yield take(...)`. This is a *blocking call*, which means the Saga
will not progress until it receives a matching action.

After receiving the queried action, the Saga triggers a call to `delay(1000)`, which in our example
returns a Promise that will be resolved after 1 second. Again, this is a blocking call, so the Saga
will wait for 1 second before continuing on (a better way is `call(delay, 1000)`, as we'll see in
the section on declarative Effects).

After the delay, the Saga dispatches an `INCREMENT_COUNTER` action using the `put(action)`
function. Here also, the Saga will wait for the dispatch result. If the dispatch call returns
a normal value, the Saga resumes *immediately* (asap), but if the result value is a Promise then the
Saga will wait until the Promise is resolved (or rejected).

To generalize, waiting for a future action (`yield take(MY_ACTION)`), waiting for the future result of
a function call (`yield delay(1000)`) or waiting for the result of a dispatch (`yield put(myAction())`)
all are the same concept. In all cases, we are yielding some form of side effects.

Note also how `incrementAsync` uses an infinite loop `while(true)` which means it will stay alive
for all the application lifetime. You can also create Sagas that last only for a limited amount of
time. For example, the following Saga waits for the first 3 `INCREMENT_COUNTER` actions,
triggers a `showCongratulation()` action and then finishes.

```javascript
function* onBoarding() {

  for(let i = 0; i < 3; i++)
    yield take(INCREMENT_COUNTER)

  yield put( showCongratulation() )
}
```

#Declarative Effects

Sagas Generators can yield Effects in multiple forms. The simplest way is to yield a Promise

```javascript
function* fetchSaga() {

  // fetch is a sample function
  // returns a Promise that will resolve with the GET response
  const products = yield fetch('/products')

  // dispatch a RECEIVE_PRODUCTS action
  yield put( receiveProducts(products) )
}
```

In the example above, `fetch('/products')` returns a Promise that will resolve with the GET response.
So the 'fetch effect' will be executed immediately . Simple and idiomatic but ...

Suppose we want to test generator above

```javascript
const iterator = fetchSaga()
assert.deepEqual( iterator.next().value, ?? ) // what do we expect ?
```

We want to check the result of the first value yielded by the generator, which is in our case the result of running
`fetch('/products')`. Executing the real service during tests is not a viable nor a practical approach, so we have to
*mock* the fetch service, i.e. we'll have to replace the real `fetch` method with a fake one which doesn't actually
run the GET request but only checks that we've called `fetch` with the right arguments (`'/products'` in our case).

Mocks make testing more  difficult and less reliable. On the other hand, functions that simply return values are
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
`call` creates a plain object describing the function call. The redux-saga middleware takes care of executing
the function call and resuming the generator with the resolved response.


This allows us to easily test the Generator outside the Redux environment.

```javascript
import { call } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, call(fetch, '/products')) // expects a call(...) value
```

Now, we don't need to mock anything, a simple equality test will suffice.

The advantage of declarative effects is that we can test all the logic inside a Saga/Generator
by simply iterating over the resulting iterator and doing a simple equality tests on the values
yielded successively. This is a real benefit, as your complex asynchronous operations are no longer
black boxes, you can test in detail their logic of operation no matter how complex it is.

The `call` method is well suited for functions that return Promise results. Another function
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

Of course you're not forced to handle you API errors inside try/catch blocks, you can also make
your API service return a normal value with some error flag on it

```javascript
function buyProducts(cart) {
  return doPost(...)
    .then(result => {result})
    .catch(error => {error})
}

function* checkout(getState) {
  while( yield take(types.CHECKOUT_REQUEST) ) {
    const cart = getState().cart
    const {result, error} = yield call(api.buyProducts, cart)
    if(!error)
      yield put(actions.checkoutSuccess(result))
    else
      yield put(actions.checkoutFailure(error))
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

Because the 2nd effect will not get executed until the first call resolves. Instead we have to write

```javascript
import { call } from 'redux-saga'

// correct, effects will get executed in parallel
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repose')
]
```

When we yield an array of effects, the generator is blocked until all the effects are resolved (or as soon as
one is rejected, just like how `Promise.all` behaves).

Sometimes we start multiple tasks in parallel but we don't want to wait for all of them, we just need
to get the *winner*: the first one that resolves (or rejects). The `race` function offers a way of
triggering a race between multiple effects.

The following sample shows a Saga that triggers a remote fetch request, and constrain the response with a
1 second timeout.

```javascript
import { race, take, put } from 'redux-saga'

function* fetchPostsWithTimeout() {
  while( yield take(FETCH_POSTS) ) {
    // starts a race between 2 effects
    const {posts, timeout} = yield race({
      posts   : call(fetchApi, '/posts'),
      timeout : call(delay, 1000)
    })

    if(posts)
      put( actions.receivePosts(posts) )
    else
      put( actions.timeoutError() )
  }
}
```

#Sequencing Sagas via yield*

You can use the builtin `yield*` operator to compose multiple sagas in a sequential way.
This allows you to sequence your *macro-tasks* in a simple procedural style.

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

Note that using `yield*` will cause the JavaScript runtime to *spread* the whole sequence.
The resulting iterator (from `game()`) will yield all values from the nested
iterators. A more powerful alternative is to use the more generic middleware composition mechanism.

#Composing Sagas

While using `yield*` provides an idiomatic way of composing Sagas. This approach has some limits:

- You'll likely want to test nested generators separately. This leads to some duplication in the test
code as well as an overhead of the duplicated execution. We don't want to execute a nested generator
but only make sure the call to it was issued with the right argument.

- More importantly, `yield*` allows only for sequential composition of tasks, you can only
yield* to one generator at a time.

You can simply use `yield` to start one or more subtasks in parallel. When yielding a call to a
generator, the Saga will wait for the generator to terminate before progressing, then resumes
with the returned value (or throws if an error propagates from the subtask).


```javascript
function* fetchPosts() {
  yield put( actions.requestPosts() )
  const products = yield call(fetchApi, '/products')
  yield put( actions.receivePosts(products) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield call(fetchPosts) // waits for the fetchPosts task to terminate
  }
}
```

Yielding to an array of nested generators will start all the sub-generators in parallel and wait
for them to finish. Then resume with all the results

```javascript
function* mainSaga(getState) {
  const results = yield [ call(task1), call(task2), ...]
  yield put( showResults(results) )
}
```

In fact, yielding Sagas is no more different than yielding other effects (future actions, timeouts ...).
It means you can combine those Sagas with all the other types using the effect combinators.

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
      yield put( showScore(score) )
    }
  }

}
```

#Non blocking calls with fork/join

the `yield` statement causes the generator to pause until the yielded effect resolves or rejects.
If you look closely at this example

```javascript
function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield put( actions.requestPosts() )
    const posts = yield call(fetchApi, '/posts') // blocking call
    yield put( actions.receivePosts(posts) )
  }
}
```

the `watchFetch` generator will wait until `yield call(fetchApi, '/posts')` terminates. Imagine that the
`FETCH_POSTS` action is fired from a `Refresh` button. If our application disables the button between
each fetch (no concurrent fetches) then there is no issue, because we know that no `FETCH_POSTS` action
will occur until we get the response from the `fetchApi` call.

But what happens if the application allows the user to click on `Refresh` without waiting for the
current request to terminate ?

The following example illustrates a possible sequence of the events

```
UI                              watchFetch
--------------------------------------------------------
FETCH_POSTS.....................call fetchApi........... waiting to resolve
........................................................
........................................................                     
FETCH_POSTS............................................. missed
........................................................
FETCH_POSTS............................................. missed
................................fetchApi returned.......
........................................................
```

When `watchFetch` is blocked on the `fetchApi` call, all `FETCH_POSTS` occurring in between the
call and the response are missed.

To express non blocking calls, we can use the `fork` function. A possible rewrite of the previous example
with `fork` can be

```javascript
import { fork, call, take, put } from 'redux-saga'

function* fetchPosts() {
  yield put( actions.requestPosts() )
  const posts = yield call(fetchApi, '/posts')
  yield put( actions.receivePosts(posts) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield fork(fetchPosts) // non blocking call
  }
}
```

`fork` accepts function/generator calls as well as simple effects

```javascript
yield fork(func, ...args)       // simple async functions (...) -> Promise
yield fork(generator, ...args)  // Generator functions
yield fork( put(someActions) )  // Simple effects
```

The result of `yield fork(api)` is a *Task descriptor*. To get the result of a forked Task
in a later time, we use the `join` function

```javascript
import { fork, join } from 'redux-saga'

// non blocking call
const task = yield fork(subtask, ...args)

// ... later
// now a blocking call, will resume with the outcome of task
const result = yield join(task)
```

You can also ask a Task if it's still running

```javascript
// attention, we don't use yield
const stillRunning = task.isRunning()
```


#Building examples from sources

Pre-requisites

- browserify
- [budo](https://github.com/mattdesl/budo) to serve with live-reload `npm i -g budo`

You can also build the examples manually, and open `index.html` at the root of each example
directory to run.

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

Below the examples ported (so far) from the Redux repos

Counter example
```
// run with live-reload server
npm run counter

// manual build
npm run build-counter

// test sample for the generator
npm run test-counter
```

Shopping Cart example
```
// run with live-reload server
npm run shop

// manual build
npm run build-shop

// test sample for the generator
npm run test-shop
```

async example
```
// run with live-reload server
npm run async

// manual build
npm run build-async

//sorry, no tests yet
```

real-world example (with webpack hot reloading)
```
cd examples/real-world
npm install
npm start
```
