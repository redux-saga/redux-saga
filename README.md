# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

An alternative Side Effect model for Redux applications. Instead of dispatching thunks
which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side Effects logic in a central place.

This means the logic of the application lives in 2 places

- Reducers are responsible of handling state transitions between actions

- Sagas are responsible of orchestrating complex/asynchronous operations.

Sagas are created using Generator functions.

> As you'll see in the rest of this README. Generators, while they seem lower level than ES7 async
functions, allow some features like declarative effects, cancellation. Which are harder, if Not
impossible, to implement with simple async functions.


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
- [Waiting for future actions](#waiting-for-future-actions)
- [Dispatching actions to the store](#dispatching-actions-to-the-store)
- [A common abstraction: Effect](#a-common-abstraction-effect)
- [Declarative Effects](#declarative-effects)
- [Error handling](#error-handling)
- [Effect Combinators](#effect-combinators)
- [Sequencing Sagas via yield*](#sequencing-sagas-via-yield)
- [Composing Sagas](#composing-sagas)
- [Non blocking calls with fork/join](#non-blocking-calls-with-forkjoin)
- [Task cancellation](#task-cancellation)
- [Dynamically starting Sagas with runSaga](#dynamically-starting-sagas-with-runsaga)
- [Building examples from sources](#building-examples-from-sources)
- [Using umd build in the browser](#using-umd-build-in-the-browser)

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

#Waiting for future actions

In the previous example we created an `incrementAsync` Saga. The call `yield take(INCREMENT_ASYNC)` is a
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

Above, we used the form `take(INCREMENT_ASYNC)`, which means we're waiting for an action whose type
is `INCREMENT_ASYNC`.

`take` support some more patterns to constrain future actions matching. A call of `yield take(PATTERN)` will be
handled using the following rules

- If PATTERN is undefined or `'*'`. All incoming actions are matched (e.g. `take()` will match all actions)

- If PATTERN is a function, the action is matched if PATTERN(action) is true (e.g. `take(action => action.entities)`
will match all actions having a (truthy) `entities`field.

- If PATTERN is a string, the action is matched if action.type === PATTERN (as used above `take(INCREMENT_ASYNC)`

- If PATTERN is an array, action.type is matched against all items in the array (e.g. `take([INCREMENT, DECREMENT])` will
match either actions of type `INCREMENT` or `DECREMENT`.

#Dispatching actions to the store

After receiving the queried action, the Saga triggers a call to `delay(1000)`, which in our example
returns a Promise that will be resolved after 1 second. This is a blocking call, so the Saga
will wait for 1 second before continuing on.

After the delay, the Saga dispatches an `INCREMENT_COUNTER` action using the `put(action)`
function. Here also, the Saga will wait for the dispatch result. If the dispatch call returns
a normal value, the Saga resumes *immediately* (asap), but if the result value is a Promise then the
Saga will wait until the Promise is resolved (or rejected).

#A common abstraction: Effect

To generalize, waiting for a future action, waiting for the future result of a function call like
`yield delay(1000)`, or waiting for the result of a dispatch all are the same concept. In all cases,
we are yielding some form of Effects.

What a Saga does is actually composing all those effects together to implement the desired control flow.
The simplest is to sequence yielded Effects by just putting the yields one after another. You can also use the
familiar control flow operators (if, while, for) to implement more sophisticated control flows. Or you
you can use the provided Effects combinators to express concurrency (yield race) and parallelism (yield [...]).
You can even yield calls to other Sagas, allowing the powerful routine/subroutine pattern.

For example, `incrementAsync` uses an infinite loop `while(true)` which means it will stay alive
for all the application lifetime.

You can also create Sagas that last only for a limited amount of time. For example, the following Saga
waits for the first 3 `INCREMENT_COUNTER` actions, triggers a `showCongratulation()` action and then finishes.

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

To invoke methods of some object (i.e. created with `new`), you can provide a `this` context to the
invoked functions using the following form

```javascript
yield call([obj, obj.method], arg1, arg2, ...) // as if we did obj.method(arg1, arg2 ...)
```

`apply` is an alias for the method invocation form

```javascript
yield apply(obj, obj.method, [arg1, arg2, ...])
```

`call` and `apply` are well suited for functions that return Promise results. Another function
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

`cps` supports also the same method invocation form as `call`

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
```

The result of `yield fork(api)` is a *Task descriptor*. To get the result of a forked Task
in a later time, we use the `join` function

```javascript
import { fork, join } from 'redux-saga'

function* child() { ... }

function *parent() {
  // non blocking call
  const task = yield fork(subtask, ...args)

  // ... later
  // now a blocking call, will resume with the outcome of task
  const result = yield join(task)

}
```

the task object exposes some useful methods

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

#Task cancellation

Once a task is forked, you can abort its execution using `yield cancel(task)`. Cancelling
a running task will throw a `SagaCancellationException` inside it.

To see how it works, let's consider a simple example. A background sync which can be
started/stopped by some UI commands. Upon receiving a `START_BACKGROUND_SYNC` action,
we fork a background task that will periodically sync some data from a remote server.

The task will execute continually until a `STOP_BACKGROUND_SYNC` action is triggered.
Then we cancel the background task and wait again for the next `START_BACKGROUND_SYNC` action.   

```javascript
import { take, put, call, fork, cancel, SagaCancellationException } from 'redux-saga'
import actions from 'somewhere'
import { someApi, delay } from 'somewhere'

function* bgSync() {
  try {
    while(true) {
      yield put(actions.requestStart())
      const result = yield call(someApi)
      yield put(actions.requestSuccess(result))
      yield call(delay, 5000)
    }
  } catch(error) {
    if(error instanceof SagaCancellationException)
      yield put(actions.requestFailure('Sync cancelled!'))
  }
}

function* main() {
  while( yield take(START_BACKGROUND_SYNC) ) {
    // starts the task in the background
    const bgSyncTask = yield fork(bgSync)

    // wait for the user stop action
    yield take(STOP_BACKGROUND_SYNC)
    // user clicked stop. cancel the background task
    // this will throw a SagaCancellationException into task
    yield cancel(bgSyncTask)
  }
}
```

`yield cancel(bgSyncTask)` will throw a `SagaCancellationException`
inside the currently running task. In the above example, the exception is caught by
`bgSync`. Otherwise, it will propagate up to `main`. And it if `main` doesn't handle it
then it will bubble up the call chain, just as normal JavaScript errors bubble up the
call chain of synchronous functions.

Cancelling a running task will also cancel the current effect where the task is blocked
at the moment of cancellation.

For example, suppose that at a certain point in application lifetime, we had this pending call chain

```javascript
function* main() {
  const task = yield fork(subtask)
  ...
  // later
  yield cancel(task)
}

function* subtask() {
  ...
  yield call(subtask2) // currently blocked on this call
  ...
}

function* subtask2() {
  ...
  yield call(someApi) // currently blocked on this all
  ...
}
```

`yield cancel(task)` will trigger a cancellation on `subtask`, which in turn will trigger
a cancellation on `subtask2`. A `SagaCancellationException` will be thrown inside `subtask2`,
then another `SagaCancellationException` will be thrown inside `subtask`. If `subtask`
omits to handle the cancellation exception, it will propagate up to `main`.

The main purpose of the cancellation exception is to allow cancelled tasks to perform any
cleanup logic. So we wont leave the application in an inconsistent state. In the above example
of background sync, by catching the cancellation exception, `bgSync` is able to dispatch a
`requestFailure` action to the store. Otherwise, the store could be left in a inconsistent
state (e.g. waiting for the result of a pending request)


>It's important to remember that `yield cancel(task)` doesn't wait for the cancelled task
to finish (i.e. to perform its catch block). The cancel effect behave like fork. It returns
as soon as the cancel was initiated.
>Once cancelled, a task should normally return as soon as it finishes its cleanup logic.
In some cases, the cleanup logic could involve some async operations, but the cancelled
task lives now as a separate process, and there is no way for it to rejoin the main
control flow (except dispatching actions other tasks via the Redux store. However
this will lead to complicated control flows that ae hard to reason about. It's always preferable
to terminate a cancelled task asap).

##Automatic cancellation

Besides manual cancellation. There are cases where cancellation is triggered automatically

1- In a `race` effect. All race competitors, except the winner, are automatically cancelled.

2- In a parallel effect (`yield [...]`). The parallel effect is rejected as soon as one of the
sub-effects is rejected (as implied by Promise.all). In this case, all the other sub-effects
are automatically cancelled.

Unlike in manual cancellations, unhandled cancellation exceptions are not propagated to the actual
saga running the race/parallel effect. Nevertheless, a warning is logged into the console in case
a cancelled task omitted to handle a cancellation exception.

#Dynamically starting Sagas with runSaga

The `runSaga` function allows starting sagas outside the Redux middleware environment. It also
allows you to hook up to external input/output, other than store actions.

For example, you can start a Saga on the server using

```javascript
import serverSaga from 'somewhere'
import {runSaga, storeIO} from 'redux-saga'
import configureStore from 'somewhere'
import rootReducer from 'somewhere'

const store = configureStore(rootReducer)
runSaga(
  serverSaga(store.getState),
  storeIO(store)
).done.then(...)
```

`runSaga` returns a task object. Just like the one returned from a `fork` effect.

Besides taking and dispatching actions to the store `runSaga` can also be connected to
other input/output sources. This allows you to exploit all the features of sagas to implement
control flows outside Redux.

The method has the following signature

```javascript
runSaga(iterator, {subscribe, dispatch}, [monitor])
```

Arguments

- `iterator: {next, throw}` : an iterator object, Typically created by invoking a Generator function

- `subscribe(callback) => unsubscribe`: i.e. a function which accepts a callback and returns an unsubscribe function

  - `callback(action)` : callback (provided by runSaga) used to subscribe to input events. `subscribe` must
  support registering multiple subscriptions

  - `unsubscribe()` : used by `runSaga` to unsubscribe from the input source once it
  has completed (either by normal return or thrown exception)

- `dispatch(action) => result`: used to fulfill `put` effects. Each time a `yield put(action)` is issued, `dispatch`
  is invoked with `action`. The return value of `dispatch` is used to fulfill the `put` effect. Promise results
  are automatically resolved/rejected.

- `monitor(sagaAction)` (optional): a callback which is used to dispatch all Saga related events. In the middleware
  version, all actions are dispatched to the Redux store. See the [sagaMonitor example]
  (https://github.com/yelouafi/redux-saga/blob/master/examples/sagaMonitor.js) for usage.

The `subscribe` argument is used to fulfill `take(action)` effects. Each time `subscribe` emits an action
to its callbacks, all sagas blocked on `take(PATTERN)`, and whose take pattern matches the currently incoming action
are resumed with that action.

#Building examples from sources

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

Below the examples ported (so far) from the Redux repos

Counter example
```
npm run counter

// test sample for the generator
npm run test-counter
```

Shopping Cart example
```
npm run shop

// test sample for the generator
npm run test-shop
```

async example
```
npm run async

//sorry, no tests yet
```

real-world example (with webpack hot reloading)
```
cd examples/real-world
npm install
npm start
```

#Using umd build in the browser

There's an **umd** build of `redux-saga` available in `dist/` folder. Using the umd build `redux-saga` is available as `ReduxSaga` in the window object.
The umd version is useful if you don't use webpack or browserify, you can access it directly from [npmcdn](npmcdn.com).
The following builds are available:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support _es2015 generators_ you must provide a valid polyfill, for example the one provided by *babel*: [browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). The polyfill must be imported before **redux-saga**.
