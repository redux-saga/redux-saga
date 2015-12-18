An alternative Side Effect model for Redux applications. Instead of dispatching thunks
which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side Effects logic in a central place.

This means the logic of the application lives in 2 places

- Reducers are responsible of handling state transitions between actions

- Sagas are responsible of orchestrating complex/asynchronous operations.

Sagas are created using Generator functions.

>This middleware is not only about handling asynchronous flow; If all that matters is simplifying
asynchronous control flow, we could simply use async/await with some promise middleware.

What the The middleware provides is

- A composable abstraction **Effect**: Waiting for an action, triggering State updates (by dispatching
  actions to the store), calling a remote service are all different forms of Effects. A Saga compose those
  Effects using familiar control flow constructs (if, while, for, try/catch).

- The Saga is itself an Effect that can be combined with other Effects using Effect combinators (parallel or
  race) and called from inside other Sagas, which all the power of Subroutines and
  [Structured Programming](https://en.wikipedia.org/wiki/Structured_programming)

- Effects may be yielded declaratively, i.e. you yield a description of the Effect that
will executed by the middleware. This makes your operational logic inside Generators fully testable.

- You can implement complex operations with logic that spans across multiple actions (e.g. User onBoarding, Wizard
dialogs, complex Game rules ...), which are not trivial to express using redux-thunk or other effects
middlewares that can be only fired from Action Creators.


- [Getting started](#getting-started)
- [How is this different from other asynchronous middlewares](#how-does-it-works)
- [Declarative Effects](#declarative-effects)
- [Error handling](#error-handling)
- [Effect Combinators](#effect-combinators)
- [Sequencing Sagas via yield*](#sequencing-sagas-via-yield)
- [Composing Sagas](#composing-sagas)
- [Concurrent tasks tasks with fork/join ](#concurrent-tasks-with-forkjoin)
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

#How is this different from other asynchronous middlewares

In the above example we created an `incrementAsync` Saga. The call `yield take(action)` is a
typical illustration on how Saga works.

Typically, actual middlewares handle some Effects triggered by an Action Creator. for example,
redux-thunk handles *thunks* by calling the triggered thunk providing it with `(getState, dispatch)`,
redux-promise handles Promises by dispatching their resolved values, redux-gen handles generators by
dispatching all yielded actions to the store. The common thing is that all those middlewares shares the
same 'call on each action' pattern. They will be called again and again each time an action happens,
i.e. they are scoped by the *root action* which triggered them.

Sagas works differently, they are not fired from within Action Creators but are started with your
application and choose what user actions to watch for. They are a sort of daemon tasks that run in
the background and choose their own logic of progression. In the example above, `incrementAsync` *pulls*
the `INCREMENT_ASYNC` action, the `yield take(action)` is a *blocking call*, which means the Saga
will not progress until it receives a matching action.

After receiving the queried action, the Saga triggers a call to `delay(1000)`, which in our example
returns a Promise that will be resolved after 1 second. Again, this is a blocking call, so the Saga
will wait for 1 second before continuing on (a better way is `io.call(delay, 1000)`, see section
on declarative Effects).

After the 1 second delay, the Saga dispatches an `INCREMENT_COUNTER` action using the `put(action)`
function. Here also, the Saga will wait for the dispatch result. If the dispatch call returns
a normal value, the Saga resumes *immediately*, but if the result value is a Promise then the
Saga will wait until the Promise is resolved (or rejected).

To generalize, waiting for the next action (`yield take(MY_ACTION)`), for a the future result of
a function (`yield delay(1000)`) or for the result of a dispatch (`yield put(myAction())`) are all
different expressions of the same concept: *yielding a side effect*. Basically this is how Sagas
work.

Note also how `incrementAsync` uses an infinite loop `while(true)` which means it will stay alive
for all the application lifetime. You can also create Sagas that last only for a limited amount of
time. For example, the following Saga will wait for the first 3 `INCREMENT_COUNTER` actions,
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
    try {
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

Because the 2nd Effect will not get executed until the first call resolves. Instead we have to write

```javascript
import { call, race } from 'redux-saga'

// correct, effects will get executed in parallel
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repose')
]
```

When we yield an array of effects, the Generator is blocked until all the effects are resolved (or as soon as
one is rejected, just like how `Promise.all` behaves).

Sometimes when to start multiple tasks in parallel, we don't want to wait for all of them, we just need
to get the *winner*: the first one that resolves (or rejects). The `race` function offers a way of
triggering a race between multiple effects.

The following sample shows a Saga that triggers a remote fetch request, and constrain the response with a
1 second timeout.

```javascript
function* fetchPostsWithTimeout() {
  while( yield take(FETCH_POSTS) ) {
    // starts a race between 2 effects
    const {posts, timeout} = race({
      posts   : call(fetchApi, '/posts'),
      timeout : call(delay, 1000)
    })

    if(result)
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

While using `yield*` provides an idiomatic way of compositing Sagas. The approach has some limits:

- You'll likely want to test nested generators separately. This leads to some duplication because when
testing the main generator you'll have to iterate again on all the nested generators. This
can be achieved by reusing the tests for sub-generators inside the main test but this introduce
more boilerplate inside your tests besides the overhead of the repeated execution. All we want is to
test that the main task yields to the correct subtask not actually execute it.

- More importantly, `yield*` allows only for sequential composition of tasks, you can only
yield* to one generator at a time. But there can be use cases when you want to launch multiple
tasks in parallel, and wait for them all to terminate in order to progress.

You can simply use `yield subtask()`. When yielding a call to a generator, the Saga
will wait for the generator to terminate before progressing. And resumes then with the
returned value (or throws if an error propagates from the subtask).


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

In fact, yielding Sagas is no more different than yielding other effects (future actions, timeouts ...).
It means you can combine those Sagas with all the other types of Effects using the effect combinators
(`[...effects]` and `race({...})`).

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

Or you may want to start multiple Sagas in parallel to monitor user actions and congratulate
the user when he accomplished all the desired tasks.

```javascript
function* watchTask1() {...}
function* watchTask2() {...}

function* game(getState) {
  yield [ call(watchTask1), call(watchTask2)]
  yield put( showCongratulation() )
}
```
#Concurrent tasks with fork/join

the `yield` statement causes the generator to pause until the yielded effect has resolved. If you look
closely at this example

```javascript
function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield put( actions.requestPosts() )
    const posts = yield call(fetchApi, '/posts') // will be blocked here
    yield put( actions.receivePosts(posts) )
  }
}
```

the `watchFetch` generator will wait until `yield call(fetchPosts)` terminates. Imagine that the
`FETCH_POSTS` action is fired from a `Refresh` button. If our application disables the button between
each fetch (no concurrent fecthes) then there is no issue, because we know that no `FETCH_POSTS` action
will occur until we get the response from the `fetchApi` call.

But what if the application allows the user to click on `Refresh` without waiting for the current request
to terminate ? What will happen ?

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

When `watchFetch` is blocked on the `fetchApi` call (waiting for the server response), all `FETCH_POSTS`
occurring in between the call and the response are missed.

To express non blocking call, we can use the `fork` function. A possible rewrite of the previous example
with `fork` can be

```javascript
import { fork } from 'redux-saga'

function* fetchPosts() {
  yield put( actions.requestPosts() )
  const posts = yield call(fetchApi, '/posts')
  yield put( actions.receivePosts(posts) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield fork(fetchPosts) // will not block here
  }
}
```

`fork` accepts function/generator calls as well as simple effects

```javascript
yield fork(func, ...args)       // simple async functions (...) -> Promise
yield fork(generator, ...args)  // Generator functions
yield fork( put(someActions) )  // Simple effects
```

The result of `yield fork(api)` will be a *Task descriptor*. To get the
result of a forked Task in a later time, we use the `join` function

```javascript
// non blocking call
const task = yield fork(...)

// ... later
// now a blocking call, will resolve the outcome of task
const result = yield join(...)
```

You can also ask a Task if it's still running

```javascript
// attention, we don't use yield
const stillRunning = task.isRunning()
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
