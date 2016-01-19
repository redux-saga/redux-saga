# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

这是Redux应用的又一个副作用模型。可以用来替换redux-thunk中间件。通过创建 *Sagas* 去搜集所有的副作用逻辑到一个集中过的地方。

这里意外着程序逻辑会存在两个位置。

- Reducers 负责处理action的state转换

- Sagas 负责策划统筹合成和异步操作。

Sagas 使用Generator functions（生成器函数）创建。

>这个中间件不只是处理异步流。如果需要简化异步控制流，可以容易的使用一些promise中间件的async/await函数。

这个中间件的目的?

- 一个目的是抽象出 **Effect** （影响）: 等待一个action，触发State更新 (使用分配action给store), 调用远程服务，这些都是不同像是的Effect。Saga使用常见的控制流程(if, while, for, try/catch)去组和这些Effect。

- Saga本身就是Effect。它可以通过选择器和其他Effect组合。它也可以被内部的其他Saga调用，提供丰富功能的子程序和
[结构化程序设计](https://en.wikipedia.org/wiki/Structured_programming)

- Effect可以迭代声明。你可以迭代声明一个被中间件执行的Effect。这使得你在生成器中的运算逻辑完全可测试的。

- 你可以实现复杂的业务逻辑，跨越多个操作(比如用户培训、向导对话框、复杂的游戏规则...)，这不是简单的使用其他Effect中间件表达。


- [开始](#getting-started)
- [等待将来的Action](#waiting-for-future-actions)
- [调度Store的Action](#dispatching-actions-to-the-store)
- [一个公共的抽象: Effect](#a-common-abstraction-effect)
- [声明Effect](#declarative-effects)
- [错误处理](#error-handling)
- [Effect选择器](#effect-combinators)
- [通过yield* 排序Saga](#sequencing-sagas-via-yield)
- [Composing Sagas](#composing-sagas)
- [Non blocking calls with fork/join](#non-blocking-calls-with-forkjoin)
- [Task cancellation](#task-cancellation)
- [Dynamically starting Sagas with runSaga](#dynamically-starting-sagas-with-runsaga)
- [Building examples from sources](#building-examples-from-sources)
- [Using umd build in the browser](#using-umd-build-in-the-browser)

#Getting started

安装
```
npm install redux-saga
```

创建Saga (使用Redux的计数器例子)
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

插入redux-sago到中间件管道
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

在上面的例子中，我们创建了`incrementAsync` Saga。Saga工作的典型例子是调用`yield take(INCREMENT_ASYNC)`。

典型的， 实际的中间件处理一些Effect构成，它们会被Action创建者触发。举个例子，
redux-thunk 通过调用 带 `(getState, dispatch)` 带参数的thunks来处理 *thunks* 。
redux-promise 通过调度Promise的返回值来处理Promise。redux-gen通过调用所有的迭代Action到store来处理生成器。所有这些中间件的共通是 '请求每个action'模式。当action发生的时候，他们会被一次又一次的调用。也就是说, 每次触发 *根 action*的时候， 它们都会被  *检索*。

Sagas 工作方式是不一样的，他们不是被Action创建者雇佣，但是和你的应用一起被启动，并且选择监视哪些action。它们类似于守护任务，运行在后台，并且选择他们自己的逻辑进展。在上面的例子，`incrementAsync` 使用 `yield take(...)` *拉* `INCREMENT_ASYNC` action。这是一个 *阻塞调用*, 这意味着Saga 如果没有找到匹配的action将不会推进。

上文，我们使用`take(INCREMENT_ASYNC)`的形式，它的意思是我们等待一个action它的type是`INCREMENT_ASYNC`。实际上，确切的签名是 `take(PATTERN)`， 它的模式可以下面的一种：


- 如果 PATTERN 是 undefined 或者 `'*'`。所有接入的action都将被匹配。(举例： `take()` 将匹配所有action)

- 如果 PATTERN 是函数, 如果  `PATTERN(action)` 为true 则这个action匹配(举例： `take(action => action.entities)` 匹配所有有一个 `entities`字段的action.

- 如果PATTERN是字符串，那么将匹配`action.type === PATTERN` (像上面的例子使用的`take(INCREMENT_ASYNC)`

- 如果PATTERN是数组，`action.type`只匹配数组中的项目。(举例 `take([INCREMENT, DECREMENT])` 会匹配action.type为 `INCREMENT` 或者 `DECREMENT`。

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

Besides `call`, the `apply` effect allows you to provide a `this` context to the invoked functions

```javascript
yield apply(context, myfunc, [arg1, arg2, ...])
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

#Using umd build in the browser

There's an **umd** build of `redux-saga` available in `dist/` folder. Using the umd build `redux-saga` is available as `ReduxSaga` in the window object.
The umd version is useful if you don't use webpack or browserify, you can access it directly from [npmcdn](npmcdn.com).
The following builds are available:
[https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)
[https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support _es2015 generators_ you must provide a valid polyfill, for example the one provided by *babel*: [browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). The polyfill must be imported before **redux-saga**.
