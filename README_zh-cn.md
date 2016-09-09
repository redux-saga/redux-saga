# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

这是Redux应用的又一个副作用模型。可以用来替换redux-thunk中间件。通过创建 *Sagas* 去搜集所有的副作用逻辑到一个集中过的地方。

这里意味着程序逻辑会存在两个位置。

- Reducers 负责处理action的state转换

- Sagas 负责策划统筹合成和异步操作。

Sagas 使用Generator functions（生成器函数）创建。

>这个中间件不只是处理异步流。如果需要简化异步控制流，可以容易的使用一些promise中间件的async/await函数。

这个中间件的目的?

- 一个目的是抽象出 **Effect** （影响）: 等待一个action，触发State更新 (使用分配action给store), 调用远程服务，这些都是不同形式的Effect。Saga使用常见的控制流程(if, while, for, try/catch)去组和这些Effect。

- Saga本身就是Effect。它可以通过选择器和其他Effect组合。它也可以被内部的其他Saga调用，提供丰富功能的子程序和
[结构化程序设计](https://en.wikipedia.org/wiki/Structured_programming)

- Effect可以迭代声明。你可以迭代声明一个被中间件执行的Effect。这使得你在生成器中的运算逻辑完全可测试的。

- 你可以实现复杂的业务逻辑，跨越多个操作(比如用户培训、向导对话框、复杂的游戏规则...)，这不是简单的使用其他Effect中间件表达。


- [开始](#getting-started)
- [等待未知的Action](#waiting-for-future-actions)
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

插入redux-saga到中间件管道

```javascript
// store/configureStore.js
import sagaMiddleware from 'redux-saga'
import sagas from '../sagas'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  return createStore(
    reducer,
    initialState,
    applyMiddleware(/* other middleware, */sagaMiddleware(...sagas))
  }
}
```

#Waiting for future actions

在上面的例子中，我们创建了`incrementAsync` Saga。Saga工作的典型例子是调用`yield take(INCREMENT_ASYNC)`。

典型的， 实际的中间件处理一些Effect构成，它们会被Action Creators触发。举个例子，
redux-thunk 通过调用 带 `(getState, dispatch)` 带参数的thunks来处理 *thunks* 。
redux-promise 通过调度Promise的返回值来处理Promise。redux-gen通过调用所有的迭代Action到store来处理生成器。所有这些中间件的共通是 '请求每个action'模式。当action发生的时候，他们会被一次又一次的调用。也就是说, 每次触发 *根 action*的时候， 它们都会被  *检索*。

Sagas 工作方式是不一样的，他们不是在Action Creators内被触发，而是随你的应用一起被启动，并且选择监视哪些action。它们类似于守护任务，运行在后台，并且选择他们自己的逻辑进展。在上面的例子，`incrementAsync` 使用 `yield take(...)` *等待* `INCREMENT_ASYNC` action。这是一个 *阻塞调用*, 这意味着Saga 如果没有找到匹配的action将不会继续执行。

上文，我们使用`take(INCREMENT_ASYNC)`的形式，意思是我们等待一个type是`INCREMENT_ASYNC`的action。实际上，确切的签名是 `take(PATTERN)`， 它的模式可以下面的一种：


- 如果 PATTERN 是 undefined 或者 `'*'`。所有接入的action都将被匹配。(举例： `take()` 将匹配所有action)

- 如果 PATTERN 是函数, 如果  `PATTERN(action)` 为true 则这个action匹配(举例： `take(action => action.entities)` 匹配所有有一个 `entities`字段的action.

- 如果PATTERN是字符串，那么将匹配`action.type === PATTERN` (像上面的例子使用的`take(INCREMENT_ASYNC)`

- 如果PATTERN是数组，`action.type`只匹配数组中的项目。(举例 `take([INCREMENT, DECREMENT])` 会匹配action.type为 `INCREMENT` 或者 `DECREMENT`。

#Dispatching actions to the store

接收到需要的action之后，Saga触发器调用`delay(1000)`，在我们的例子中返回一个约定（Promise），这个将在1秒后解决。这是一个阻塞调用，所以Saga会等待一秒后再继续执行。

延迟之后，Saga使用 `put(action)`函数调度 `INCREMENT_COUNTER` action。与此同时，Saga会等待调度结果。如果返回普通值，Saga立刻唤醒 *immediately*，但是如果返回值是一个Promise，Saga会等待这个Promise完成（或失败）。

#A common abstraction: Effect

一般来说，等待一个未知的action，等待像`yield delay(1000)`这样的未知的函数调用结果，或者等待一个调度的结果，这些都是相同的概念。在所有情况下，我们迭代某些形式的Effect。Saga所做的，实际上就是把所有这些Effect组合在一起，去实现期望的控制流。最简单的是一个接着一个的顺序执行yield来迭代Effect。你也可以使用常见的控制操作（if，while，for）去实现更复杂的控制流。或者你可以使用提供的Effect组合去表达并发 (yield race) 和 平行 (yield [...])。你也可以迭代调用其他Saga，允许强大的常规或者子程序模式。

举例来说，`incrementAsync` 使用了无限循环 `while(true)`，它意味着这将会在整个应用程序的生命周期都会存在。

你也可以创建只持续一段时间的Saga。举个例子，下面的Saga，等待3个`INCREMENT_COUNTER` actions, 触发一个`showCongratulation()` action，然后结束.

```javascript
function* onBoarding() {

  for(let i = 0; i < 3; i++)
    yield take(INCREMENT_COUNTER)

  yield put( showCongratulation() )
}
```

#Declarative Effects

Sagas 生成器可以生成多种形式的Effect。最简单的方式是生成一个Promise。

```javascript
function* fetchSaga() {

  // fetch is a sample function
  // returns a Promise that will resolve with the GET response
  const products = yield fetch('/products')

  // dispatch a RECEIVE_PRODUCTS action
  yield put( receiveProducts(products) )
}
```

上面的例子，`fetch('/products')` 返回一个Promise并且会被Get请求解决。所以这个获取响应会被立刻执行。简单并且顺畅，但是...

假设我们想要测试上面的生成器。

```javascript
const iterator = fetchSaga()
assert.deepEqual( iterator.next().value, ?? ) // what do we expect ?
```

我们想要检查生成器的结果，在我们的例子中运行 `fetch('/products')` 的结果。在测试期间，执行真实服务是不允许的也不是一个现实的方法，所以我们不得不 *mock* 这个fetch服务，也就是说我们将不得不使用一个假的替换这个真实的`fetch`方法，我们没有真实的运行Get请求，只是检查我们调用`fetch`是否跟着正确的参数 (在这个例子中的`'/products'` ).

模拟使测试更困难并且可信度更低。 另一方面, 函数简单的返回值更容易被测试，我们可以简单的使用 `equal()`去检查结果。这是写更可靠测试的一个途径。

不确信 ? 我推荐你对这个 [Eric Elliott的文章]
(https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d#.4ttnnzpgc)

>(...)`equal()`, 通过本质的回答，任何一个单元测试必须回答的两个最重要的问题，但是大部分还没有:
- 什么是真实的输出?
- 什么是预期的输出?

>如果你完成测试但是没有回答这两个问题，你没有一个真正的单元测试。你只有一个草率的，未完成的测试。

我们实际上需要的，仅仅是确保`fetchSaga`被调用并且参数正确。为了这个目的，这个类库提供了一些声明方式去迭代副作用，并且确保容易测试Saga逻辑。

```javascript
import { call } from 'redux-saga'

function* fetchSaga() {
  const products = yield call( fetch, '/products' ) // don't run the effect
}
```

我们这里使用 `call(fn, ...args)` 函数. **于先前的不同的是我们不立刻执行获取调用，   通过调用`call` 创建一个effect 的描述**。就像在Redux中，你使用action创建者去创建一个简单的对象去描述这个action，这个action会被Store执行，`call` 创建一个简单对象去描述这个函数的调用。redux-saga 中间件维护这个函数的调用的执行，并且当执行完成的时候，唤醒生成器。


它允许我们容易的在Redux环境的外部去测试生成器.

```javascript
import { call } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, call(fetch, '/products')) // expects a call(...) value
```

现在，我们不需要模拟任何东西，一个简单的相等测试就满足。

声明effect的优势，我们可以测试所有在Saga和生成器中的逻辑，只需要通过一个简单的迭代（通过结果迭代器）和一个简单的相等测试就可以了。这是一个真正的好处，你的复杂的异步操作将不再是黑盒子，你可以详细的测试他们的操作逻辑，不管它有多复杂。

除了 `call`，`apply` 允许你提供一个`this`上下文去执行函数。

```javascript
yield apply(context, myfunc, [arg1, arg2, ...])
```

`call` 和 `apply`是非常适合函数返回Promise结果。还有一个函数 `cps` 可以被使用到处理Node风格的函数(举例： `fn(...args, callback)` where `callback`
是`(error, result) => ()`的形式)。 举个例子

```javascript
import { cps } from 'redux-saga'

const content = yield cps(readFile, '/path/to/file')
```

当然测试的时候只要如下调用测试就可以了。

```javascript
import { cps } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, cps(readFile, '/path/to/file') )
```

#Error handling

你可以在Generator内部使用简单的try/catch语法捕捉异常。在下面的例子中，Saga捕捉 `api.buyProducts` 调用的错误(也就是一个被拒绝的Promise)

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

当然你不是必须通过try/catch代码块处理你的API错误，你也可以定义你的API服务返回一个普通值带一个错误标记，如下：

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

`yield`声明非常棒。它以一个简单并且线形的方式表示异步控制流程。但是我们也需要做一些并行的事情。你不能简单的如下写

```javascript
// Wrong, effects will be executed in sequence
const users  = yield call(fetch, '/users'),
      repose = yield call(fetch, '/repose')
```

因为第二个Effect将等到第一个执行结束后再执行，我们必须改成如下形式：

```javascript
import { call } from 'redux-saga'

// correct, effects will get executed in parallel
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repose')
]
```

当我们迭代一个Effect数组，生成器是被阻塞的直到所有的Effect都被执行完成(或者当其中有一个被拒绝，就像 `Promise.all`的运行机制 )。

有些时候我们开始并行多次任务，但是我们不想等待，我们只想得到 *胜利者*：第一个成功运行（或者被拒绝）。`race`函数提供了一种方式去触发多个effect的竞赛。

下面的例子展示Saga触发一个远程的获取请求和强迫这个请求1秒过期。

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

你可以使用内建的`yield*` 操作去以连续的方式组合多个Saga。这个允许你以过程化的风格顺序执行你的 *宏观任务*。

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

注意，使用`yield*`会引起javascript 运行时传播整个序列。这个迭代器的结果 (从 `game()`)将会迭代内部迭代器的所有值。一个更强大的替代方案是使用更通用的中间件构成机制。

#Composing Sagas

当使用`yield*`提供的方式组合Saga时，有一些局限:

- 你可能想分别测试嵌入的生成器。在测试代码中，这导致一些重复代码这和重复执行的开销是一样的。我们不想执行嵌入的生成器，但是只想确保它被分发正确的参数。

- 更重要的是, `yield*` 只被顺序执行的组成的任务。一次，你只可以 yield* 一个生成器。

你可以简单的使用 `yield`并行开始一个或者多个子任务。当迭代运行一个生成器，运行前，Saga将会等待生成器终止，这时通过返回值唤醒(或者从子任务中抛出一个反向错误).


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

迭代一个嵌入生成器将会并行开始所有的子生成器，并且等待他们完成。这时通过所有的结果唤醒。

```javascript
function* mainSaga(getState) {
  const results = yield [ call(task1), call(task2), ...]
  yield put( showResults(results) )
}
```

实际上，Sagas相比迭代其他effect没有什么不同(未来action, timeouts ...)。这意味着你可以通过所有的其他方式，使用Effect协调器组合这些Saga。

举个例子你也可能想用户必须在规定时间内完成游戏。

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

`yield`声明引起生成器暂停，直到这次迭代完成或被拒绝。如果你仔细看这个例子。

```javascript
function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield put( actions.requestPosts() )
    const posts = yield call(fetchApi, '/posts') // blocking call
    yield put( actions.receivePosts(posts) )
  }
}
```

`watchFetch` 生成器将会等待到`yield call(fetchApi, '/posts')` 运行结束。设想
`FETCH_POSTS` action 被 `刷新`按钮触发。如果我们的应用每次获取禁用这个按钮(不存在并发获取)，这里将不会有问题，因为我们知道没有`FETCH_POSTS`action会发生直到我们得到`fetchApi`调用的响应。

但是当应用程序允许用户点击`刷新`按钮而不需要等待当前请求完成，什么事情会发生？

下面的例子将阐明一个可能的事件发生顺序。

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

当`watchFetch`阻塞在`fetchApi`调用，所有的在调用和响应之间的`FETCH_POSTS`都被错过。为了表达不阻塞的调用，我们可以使用`fork`函数。上面的例子可以使用`fork`重写，如下：

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

`fork`调用函数和生成器和普通effect一样。

```javascript
yield fork(func, ...args)       // simple async functions (...) -> Promise
yield fork(generator, ...args)  // Generator functions
yield fork( put(someActions) )  // Simple effects
```

`yield fork(api)`的结果是一个 *任务描述符*。为了延迟取得分支的任务结果，我们使用`join`函数

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

任务对象暴露了一些很有用的方法

<table>
  <tr>
    <th>方法</th>
    <th>返回值</th>
  </tr>
  <tr>
    <td>task.isRunning()</td>
    <td>如果是true则任务没有完成或异常</td>
  </tr>
  <tr>
    <td>task.result()</td>
    <td>任务的返回值， 如果任务还在运行则是 `undefined` </td>
  </tr>
  <tr>
    <td>task.error()</td>
    <td>任务抛出异常。如果任务还在运行中则返回 `undefined` </td>
  </tr>
  <tr>
    <td>task.done</td>
    <td>一个Promise
        <ul>
          <li>任务完成并返回值 with task's return value</li>
          <li>任务失败并抛出异常</li>
        </ul>
      </td>
  </tr>
</table>

#Task cancellation

任务取消

当任务被分支，你可以通过执行`yield cancel(task)`终止。取消一个执行的任务内部会抛出一个`SagaCancellationException`异常。

为了查看它是怎么工作的，让我们研究一个简单的例子。一个后台同步可以被开始和结束通过页面UI命令。 下面接收一个`START_BACKGROUND_SYNC` action,我们fork一个后台任务，这个任务会定期从远程服务器同步数据。

这个任务会不断的执行，直到 `STOP_BACKGROUND_SYNC` action 触发。 这时我们取消后台任务并且等待下一个`START_BACKGROUND_SYNC` action.   

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

`yield cancel(bgSyncTask)` 将会在当前运行的内部触发一个`SagaCancellationException`异常。在上面的例子， 异常在`bgSync`中被捕捉，否则异常会被抛出到`main`，并且如果异常在`main`中没有被处理，它会沿着调用链网上冒泡，就像一个普通的javascript同步函数异常沿着调用链冒泡。

取消一个运行中的任务也会取消当前被阻塞任务所在的effect。

举个例子，假设在应用程序生命周期中确定的某一个点，我们有这样一个预调用链

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

`yield cancel(task)`将会触发一个`subtast`的取消操作，然后转到触发`subtask2`的取消。在`subtask2`中，一个`SagaCancellationException`将会被抛出，并且另一个`SagaCancellationException`将会在`subtask`中被抛出。 如果`subtask`省略了处理取消异常，这个异常将会冒泡传出到`main`。

取消异常的主要作用是允许取消任务后去执行某一个清理逻辑。所以我们不允许程序进入一个前后不一致的状态。在上面后台同步执行的例子中，通过捕捉取消异常，`bgSync`会调度一个`requestFailure` action。 否则，这个store会进去前后不一致的状态(举个例子：等待执行请求的结果)


>记住`yield cancel(task)`不会等待取消任务这个操作完成，这一点非常重要。(换句话说去执行它的异常处理是取消这个操作完成的时候)。cancel的作用有点像fork。当cancel开始它就返回值。
>一旦取消，任务需要尽快完成它的清理逻辑。在有些场合，清理逻辑可以包含一些异步操作，取消任务是一个单独的进程，并且这里没有办法重新进入主控制流程(除非通过Redux store调度action。然而这会导致复杂的，很难理解的控制流程。 所以最好是尽快结束任务).

##Automatic cancellation

除了手动取消，这里有一些自动触发取消的例子。

1- 在一个`race` effect。所有的比赛竞争对手，除了胜利者，其它都自动取消。

2- 在一个并行effect (`yield [...]`)。当其中一个子effect失败（于Promise.all相似）， 在这个例子中其他的子effect全部自动取消。

不同于手动取消，未处理的取消异常不会冒泡到实际saga运行的race/parallel effect。然而，假如取消任务并且没有处理取消异常，一个警告log会写到控制台。

#Dynamically starting Sagas with runSaga

函数`runSaga`允许在Redux中间件环境的外部开始saga。除了store action外，它也允许你连接外部的输入输出。

举个例子，你可以在服务端这样使用Saga

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

`runSaga`返回一个任务对象，就像`fork` effect的返回值。

此外获取和调度action到store，`runSaga`也可以连接其他输入输出代码。它允许你在Redux外部，利用所有Saga的特性实现控制流。

这个方法具有如下签名

```javascript
runSaga(iterator, {subscribe, dispatch}, [monitor])
```

参数

- `iterator: {next, throw}` : 一个迭代器对象，通常调用函数生成器

- `subscribe(callback) => unsubscribe`: 也就是接收一个回调函数，并返回一个退订函数

  - `callback(action)` : 回调函数 (runSaga提供) 用于订阅输入事件。 `subscribe`必须支持注册多个订阅。

  - `unsubscribe()` : 被`runSaga`调用，用于当输入程序完成（或者一般return或者异常）时退订

- `dispatch(action) => result`: 用于完成 `put` effect。每次运行`yield put(action)`，`dispatch`会和`action`一起被调用，`dispatch`的返回值被用于完成`put` effect。Promise结果自动完成或者取消。

- `monitor(sagaAction)` (可选): 是被用于调用所有Saga关联事件的回调。在中间件的版本，所有action都调度到Redux Store。详细查看[sagaMonitor example]
  (https://github.com/yelouafi/redux-saga/blob/master/examples/sagaMonitor.js) 的用法.

参数`subscribe`用于完成`take(action)` effects，每次`subscribe` 运行一个action或者他的回调，Saga会阻塞在`take(PATTERN)`，并且take匹配当前即将运行的action，并且唤醒这个action。

#Building examples from sources

预先要求

- browserify
- [budo](https://github.com/mattdesl/budo) ， 在线安装： `npm i -g budo`

你可以手动运行例子，或者打开每个例子根目录的`index.html`去运行。

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

下面的例子是从Redux移植（到目前为止）

计数器例子
```
// run with live-reload server
npm run counter

// manual build
npm run build-counter

// test sample for the generator
npm run test-counter
```

购物车例子
```
// run with live-reload server
npm run shop

// manual build
npm run build-shop

// test sample for the generator
npm run test-shop
```

异步例子
```
// run with live-reload server
npm run async

// manual build
npm run build-async

//sorry, no tests yet
```

real-world例子 (使用webpack热启动)
```
cd examples/real-world
npm install
npm start
```

#Using umd build in the browser

在`dist/`目录，`redux-saga`有一个可用的 **umd** 构建。使用umd构建，`redux-saga` 可以作为`ReduxSaga`在window对象中使用。如果你不使用webpack或者browserify，umd版本非常有用，你可以通过[unpkg](unpkg.com)直接使用。
下面是可用的构建:
[https://unpkg.com/redux-saga/dist/redux-saga.js](https://unpkg.com/redux-saga/dist/redux-saga.js)
[https://unpkg.com/redux-saga/dist/redux-saga.min.js](https://unpkg.com/redux-saga/dist/redux-saga.min.js)

**重要提示!** 如果目标浏览器不支持 _es2015 generators_ 你必须使用好的转换库，如 *babel*: [browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). 这个库必须在 **redux-saga** 前被加载.
