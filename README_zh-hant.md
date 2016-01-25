# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

另一種 Redux 應用的 Side Effect 模型。替代 redux-thunk 負責發送的 thunk。你可以建立 *Sagas* 在一個地方來集中所有 Side Effect 邏輯。

這表示應用程式的邏輯存在兩個地方：

- Reducers 負責 actions 之間的狀態轉換。

- Sagas 負責編排複雜/非同步操作。

建立 Sagas 係使用 Generator 函式。

> 接下來的內容你將會看見。Generators，雖然看起來比 ES7 aysnc 函式還低階（low level），但是能提供如 陳述性作用（delcarative effects）、取消（cancellation）等功能。這些較為困難的功能無法用簡單的 async 函式實作出來。

此中介軟體提出了：

- 可組合的抽象 **Effect**：等候某個 action；觸發 State 改變（透過分派 actions 到 store）；呼叫某個遠端服務；這些不同形式的 Effects。一個 Saga 可使用熟悉的流程控制組成（if、while、for、try/catch）來組合這些 Effects。

- Sage 本身就是一種 Effect。可以夠過使用協調器（combinators）來組合其他 Effects。也可以被別的 Sagas 呼叫，提供最大功率的 Subroutines 及 [Structured Programming](https://en.wikipedia.org/wiki/Structured_programming)。

- Effects 可能以陳述方式（declaratively）引起（yielded）。你引起一種 Effect 的描述，中介軟體便會執行它。這讓你在 Generators 內的邏輯能夠充分地進行測試。

- 你可以實作複雜的邏輯操作，橫跨多個 actions（例如：用戶入職訓練、精靈對話框、複雜遊戲規則⋯），這些不是平凡的表達。

- [開始入門](#getting-started)
- [等候未來的 actions](#waiting-for-future-actions)
- [派送 actions 到 store](#dispatching-actions-to-the-store)
- [常見的抽象：Effect](#a-common-abstraction-effect)
- [陳述性 Effects](#declarative-effects)
- [錯誤處理](#error-handling)
- [Effect 協調器](#effect-combinators)
- [透過 yield* 的順序性 Sagas](#sequencing-sagas-via-yield)
- [組合 Sagas](#composing-sagas)
- [非阻塞式的呼叫 — fork/join](#non-blocking-calls-with-forkjoin)
- [任務取消](#task-cancellation)
- [動態啟動 Sagas — runSaga](#dynamically-starting-sagas-with-runsaga)
- [從原始碼組建範例](#building-examples-from-sources)
- [在瀏覽器使用 umd 組建](#using-umd-build-in-the-browser)

#開始入門

安裝

```
npm install redux-saga
```

創造一個 Saga（使用來自 Redux 的計數器範例）

```javascript
import { take, put } from 'redux-saga'
// sagas/index.js

function* incrementAsync() {

  while(true) {

    // 等待每次 INCREMENT_ASYNC action
    const nextAction = yield take(INCREMENT_ASYNC)

    // delay 是個範例函式
    // 回傳一個 Promise 會在指定的毫秒（ms）後解決（resolves）
    yield delay(1000)

    // 分派 INCREMENT_COUNTER
    yield put( increment() )
  }

}

export default [incrementAsync]
```

將 redux-saga 接到中介軟體管道

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

#等候未來的 actions

前一個範例中，我們創造了一個 `等候未來的 actions` Saga。其中的 `yield take(INCREMENT_ASYNC)` 呼叫是 Sagas 如何運作的一個典型實例。

通常情況下，實際是由中介軟體們掌控這些 Effect 的構成，由 Action Creator 所觸發。舉例來說，redux-thunk 掌控 *thunks*，並將 `(getState, dispatch)` 作為參數帶入，redux-promise 掌控 Promises，分派其解析後的值。redux-gen 掌控 generators，分派所有引起（yielded）的 actions 到 store。這裡所有中介軟體有個共通點，就是 '由每個 action 呼叫' 樣式。當 action 發生時，它們將會一次又一次的被呼叫，換言之，他們的範圍由觸發它們的 *root action* 決定。

Sagas 運作方式不同，不是由 Action Creators 所觸發，而是與你的應用程式一起並決定哪個使用者 actions 需要關注。就像是在背景執行的服務，選擇自己邏輯的進展。上述範例中，`incrementAsync` 使用 `yield take(...)` *拉* `INCREMENT_ASYNC` action。這是一種*阻塞式呼叫*，表示 Saga 不會進行下去直到收到符合的 action。

上述中使用了 `take(INCREMENT_ASYNC)` 形式，表示正在等候 type 為 `INCREMENT_ASYNC` 的 action。

`take` 支援某些樣式以便約束未來符合的 actions。`yield take(PATTERN)` 的呼叫將會根據下列規則進行掌控：

- 當 PATTERN 是 undefined 或 `'*'` 時。所有新進的 actions 都會符合（例如，`take()` 將會匹配所有 actions）

- 當 PATTERN 是 函式 時，只有 PATTERN(action) 為真時，action 才會匹配。（例如，`take(action => action.entities)` 將會匹配所有有 `entities` 欄位的 action）。

- 當 PATTERN 是 字串 時，只有 action.type === PATTERN 時才會匹配（如同上述範例的 `take(INCREMENT_ASYNC)`）

- 當 PATTERN 是 陣列 時，只有 action.type 符合陣列中其中一個元素時才會匹配（例如，`take([INCREMENT, DECREMENT])` 將會匹配 `INCREMENT` 或 `DECREMENT`。）

#派送 actions 到 store

在接收到查詢的 action 之後，Saga 觸發一個 `delay(1000)` 呼叫，在這個範例之中，回傳了一個 Promise，會在 1 秒後解決。這是個組塞式的呼叫，因此 Saga 將會等候 1 秒後繼續。

在延遲之後，Saga 使用 `put(action)` 函式分派了一個 `INCREMENT_COUNTER` action。相同地，這裡也將會等候分派後的結果。如果分派呼叫回傳的是一般的值，Saga 立即地恢復繼續（asap），但如果是個 Promise，則會等候 Promise 解決（或拒絕）。

#常見的抽象：Effect

為了一般化，等待一個未來的 action；等待一個未來的結果，像是呼叫 `yield delay(1000)`；或者等待一個分派的結果都是相同的概念。所有的案例中，我們都在引起某些 Effects 形式。 

而 Saga 所做的事，實際上是將所有這些 effects 組合在一起，以便實作想要的控制流程。最簡單的方式是一個 yeidls 接著一個另一個 yields，循序引起 Effects。也可以使用熟悉的控制流程操作子（if、while、for）來實作更複雜的控制流程。或者你想要使用 Effects 協調器來表達並發（concurrency，yield race）及平行（parallelism，yield [...]）。甚至可以引起其他的 Sagas，讓你擁有強大的 routine/subroutine 樣式。

舉例來說，`incrementAsync` 使用無窮迴圈 `while(true)` 來表示將會永遠運作於應用程式的生命週期之內。

你也可以創造有限時間的 Sagas。例如，下列 Saga 等候前 3 個 `INCREMENT_COUNTER` actions 並觸發 `showCongratulation()` action，接著便結束。

```javascript
function* onBoarding() {

  for(let i = 0; i < 3; i++)
    yield take(INCREMENT_COUNTER)

  yield put( showCongratulation() )
}
```

#陳述性 Effects

Sagas Generators 可以引起多種形式的 Effects。最簡單的一種是引起 Promise 

```javascript
function* fetchSaga() {

  // fetch 是個簡單的函式
  // 回傳一個 Promise 將會解決 GET 回應
  const products = yield fetch('/products')

  // 分派 RECEIVE_PRODUCTS action
  yield put( receiveProducts(products) )
}
```

上述範例中，`fetch('/products')`回傳一個 Promise 將會解決 GET 回應，所以 'fetch effect' 將會立即地執行。簡單且符合語言習慣，但是⋯

假設我們要測試上述 generator

```javascript
const iterator = fetchSaga()
assert.deepEqual( iterator.next().value, ?? ) // 該期待什麼結果 ?
```

我們想要檢查 generator 第一個引起的結果，在這個案例中是執行 `fetch('/products')` 之後的結果。測試中執行實際的服務不是可行方式，也不是實踐方法，所以需要*仿製*這個 fetch 服務，換言之，需要使用假的來替換真正的 `fetch` 方法，假的實際上並不會發出 GET 請求，而是用來檢查是否用了正確的參數（這個案例中，參數為`'/products'`）來呼叫 `fetch`。

仿製讓測試更困難、更不可靠。在另一方面，函式只單純回傳值更容易測試，可以單純的使用 `equal()` 來檢查結果。這是撰寫最可靠測試的方法。

不相信？鼓勵你閱讀 [Eric Elliott 這篇文章](https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d#.4ttnnzpgc)。

>(...)`equal()`，就本質回答兩個最重要的問題，每個單元測試都必須回答，但大多數都不會回答：
>
>- 實際輸出是什麼？
>- 期望輸出是什麼？
>
>如果你完成一個測試但沒有回答上述兩個問題，那就不是一個真正的單元測試。你有的是一個草率的、不完整的測試。

而我們實際所需的，只是需要確保 `fetchSaga` 引起的一個呼叫，其呼叫的函式以及參數是正確的。因此，此函式庫提供一些陳述性的方式來引起 Side Effects，讓 Saga 的邏輯容易測試

```javascript
import { call } from 'redux-saga'

function* fetchSaga() {
  const products = yield call( fetch, '/products' ) // 不會執行 effect
}
```

這裡使用了 `call(fn, ...args)` 函式。**與之前範例的差異之處在於，不會立即地執行呼叫 fetch，取而代之的是，`call` 創造出 effect 的描述**。如同你在 Redux，使用 action creators 創造出 object 描述 action，將會被 Store 執行，`call` 創造出 object 描述函式呼叫。redux-saga 中介軟體負責函式呼叫並恢復 generator 帶著解決的回應。

這讓我們在 Redux 環境之外也能容易地測試 Generator。

```javascript
import { call } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, call(fetch, '/products')) // 預期是 call(...) 值
```

現在，不需仿製任何事情。簡單的同等測試便足夠。

陳述式 effects 的優點是測試所有在 Saga/Generator 內的邏輯，簡單地反覆檢查迭代器的結果值，持續地對值進行單純的同等測試。真正的好處是，複雜的非同步操作不再是黑盒子，無論如何複雜，都可以詳細地測試，

呼叫某些物件的方法（即使用 `new` 創造），你可以用下列形式提供 `this` 上下文（context）到調用的函式

```javascript
yield call([obj, obj.method], arg1, arg2, ...) // 如同我們使用 obj.method(arg1, arg2 ...)
```

`apply` 是個化名，用於方法調用形式

```javascript
yield apply(obj, obj.method, [arg1, arg2, ...])
```

`call` 及 `apply` 適合在回傳 Promise 的函式。其他函式 `cps` 可用來處理 Node 風格函式（例如，`fn(...args, callback)` 其中 `callback` 是 `(error, result) => ()` 形式）。舉例來說

```javascript
import { cps } from 'redux-saga'

const content = yield cps(readFile, '/path/to/file')
```

當然你可以測試它

```javascript
import { cps } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, cps(readFile, '/path/to/file') )
```

`cps` 同樣支援相同的方法調用形式，如同 `call` 一樣。

#錯誤處理

Generator 裡面可以使用單純的 try/catch 語句來捕獲錯誤。在下列範例中，Saga 從 `api.buyProducts` 呼叫（即拒絕的 Promise）中捕獲錯誤

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

當然並不是強迫你要用 try/catch 區塊來處理你的 API 錯誤，你也可以讓 API 服務回傳一般的值帶有錯誤旗標

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


#Effect 協調器

`yield` 陳述式非常適合用來表示非同步控制流程，一種簡單且線性的風格。但是我們同樣地需要平行運作。不能單純撰寫

```javascript
// 錯誤，effects 將會依序執行
const users  = yield call(fetch, '/users'),
      repose = yield call(fetch, '/repose')
```

因為第 2 個 effect 並不會執行，直到第 1 個呼叫解決。取而代之我們要寫成

```javascript
import { call } from 'redux-saga'

// 正確，effects 將會平行地執行
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repose')
]
```

當我們引起一個陣列的 effects，generator 將會阻塞直到所有 effects 都被解決（或者一旦有一個被拒絕，就如同 `Promise.all` 行為）。

有時候平行發出多個任務但並不希望等代所有任務，而是只需要取得一個 *贏家*：第一個解決（或拒絕）。函式 `race` 提供了在多個 effects 之間的競賽功能。

下列範例顯示 Saga 觸發了一個遠端擷取請求，並且限制該請求在 1 秒後超時。

```javascript
import { race, take, put } from 'redux-saga'

function* fetchPostsWithTimeout() {
  while( yield take(FETCH_POSTS) ) {
    // 發出 2 個 effects 之間的競賽
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

#透過 yield* 的順序性 Sagas

你可以使用內建的 `yield*` 操作子依序組合多個 sagas。讓你可以用簡單的程序式風格來依序執行 *macro-tasks*

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

請注意使用 `yield*` 會導致 JavaScript 執行期間*傳播*整個順序。迭代器的結果會引起巢狀迭代器。更加強大的替代方式是採用更一般的中介軟體構成機制。

#組合 Sagas

雖然使用 `yield*` 提供一個語言習慣的方式來組合 Sagas。這個方式有些限制：

- 你可能希望分開測試巢狀的 generators。這導致某些重複的測試程式碼產生以及重複執行的損耗。我們不希望執行一個巢狀 generator，只希望確保正確的參數呼叫。

- 更重要地，`yield*` 只允許順序性的任務組成，你一次只能 yield* 一個 generator。

你可以簡單地使用 `yield` 來開始一個或平行多個子任務。當引起一個呼叫到 generator，Saga 將會等候 generator 終止才開始處理，接著使用回傳值再開始（或者拋出錯誤，當錯誤來自子任務）。


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

引起一個巢狀 generatos 的陣列將會平行地開始所有 sub-generators 並等候全部完成。接著用所有結果值再開始

```javascript
function* mainSaga(getState) {
  const results = yield [ call(task1), call(task2), ...]
  yield put( showResults(results) )
}
```

事實上，引起 Sagas 與引起其他 effects 並無不同（未來 actions、超時 ⋯）。這表示你可以使用 effect 調節器結合這些 Sagas 及其他類型。

舉例來說你希望使使用者在限定時間內完成某些遊戲

```javascript
function* game(getState) {

  let finished
  while(!finished) {
    // 必須在 60 秒內完成
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

#非阻塞式的呼叫 — fork/join

`yield` 陳述式造成 generator 暫停直到引起的 effect 被解決或拒絕。如果你近一點看看這個範例

```javascript
function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield put( actions.requestPosts() )
    const posts = yield call(fetchApi, '/posts') // 阻塞式呼叫
    yield put( actions.receivePosts(posts) )
  }
}
```

`watchFetch` generator 將會等候直到 `yield call(fetchApi, '/posts')` 結束。想像 `FETCH_POSTS` 是透過一個 `重整` 按鈕觸發。如果我們應用程式在每個 fetch 之間關閉按鈕（非並發 fetch）那這樣不會有問題，因為我們知道不會有額外的 `FETCH_POSTS` action 觸發直到取得 `fetchApi` 呼叫的回應。

但是如果應用程式希望允許使用者點擊 `重整` 按鈕，而不需要等候目前的請求結束？

下列範例描述了一個可能的事件順序

```
UI                              watchFetch
--------------------------------------------------------
FETCH_POSTS.....................呼叫 fetchApi............ 等待解決
........................................................
........................................................                     
FETCH_POSTS............................................. 遺漏
........................................................
FETCH_POSTS............................................. 遺漏
................................fetchApi 回傳............
........................................................
```

當 `watchFetch` 阻塞於 `fetchApi` 呼叫，所有在呼叫及回應之間發生的 `FETCH_POSTS` 都會被遺漏。

為了表達非阻塞式呼叫，我們可以使用 `fork` 函式。用 `fork` 改寫前述範例的一種可能寫法是

```javascript
import { fork, call, take, put } from 'redux-saga'

function* fetchPosts() {
  yield put( actions.requestPosts() )
  const posts = yield call(fetchApi, '/posts')
  yield put( actions.receivePosts(posts) )
}

function* watchFetch() {
  while ( yield take(FETCH_POSTS) ) {
    yield fork(fetchPosts) // 非阻塞式呼叫
  }
}
```

`fork`，就像是 `call`，接受 函式/generator 呼叫。

```javascript
yield fork(func, ...args)       // 單純非同步函式 (...) -> Promise
yield fork(generator, ...args)  // Generator 函式
```

`yield fork(api)` 的結果是個 *任務描述子*。為了在稍候能夠取得 forked 任務的結果，我們使用 `join` 函式

```javascript
import { fork, join } from 'redux-saga'

function* child() { ... }

function *parent() {
  // 非阻塞式呼叫
  const task = yield fork(subtask, ...args)

  // ... 稍候
  // 現在是阻塞式呼叫，將會再開始帶著任務的結果
  const result = yield join(task)

}
```

任務物件公開幾個有益的方法

<table>
  <tr>
    <th>方法</th>
    <th>回傳值</th>
  </tr>
  <tr>
    <td>task.isRunning()</td>
    <td>回傳 true 當任務尚未回傳，或者拋出錯誤</td>
  </tr>
  <tr>
    <td>task.result()</td>
    <td>任務回傳的結果。`undefined` 當任務仍然在執行中</td>
  </tr>
  <tr>
    <td>task.error()</td>
    <td>任務拋出的錯誤。`undefined` 當任務仍然在執行中</td>
  </tr>
  <tr>
    <td>task.done</td>
    <td>
      下列兩種其一的 Promise
        <ul>
          <li>帶有任務回傳值的解決</li>
          <li>帶有任務拋出的錯誤的拒絕</li>
        </ul>
      </td>
  </tr>
</table>

#任務取消

當一個任務已經開始，你可以使用 `yield cancel(task)` 來終止執行。取消執行中任務將會導致內部拋出 `SagaCancellationException` 錯誤。

為了看如何運作，讓我們考慮一個簡單的範例。一個背景同步功能，可以透過某些 UI 命令來開始/暫停。根據接收 `START_BACKGROUND_SYNC` action，我們將開始一個背景任務，週期性地從遠端伺服器同步某些資料。

任務持續的執行，直到 `STOP_BACKGROUND_SYNC` action 觸發。接著將會取消背景任務並且再次等待下一個 `START_BACKGROUND_SYNC` action。

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
    // 開始一個任務於背景執行
    const bgSyncTask = yield fork(bgSync)

    // 等候使用者的停止 action
    yield take(STOP_BACKGROUND_SYNC)
    // 使用者點選了停止。取消背景任務
    // 這將會拋出一個 SagaCancellationException 錯誤到任務中
    yield cancel(bgSyncTask)
  }
}
```

`yield cancel(bgSyncTask)` 將會拋出 `SagaCancellationException` 在目前執行的任務之中。在上述範例中，例外由 `bgSync` 捕獲。否則，它將會傳播到 `main`。如果 `main` 沒有處理它，它將會在呼叫鏈持續往上，如同一般 JavaScript 的錯誤，持續在同步函式呼叫鏈中傳播。

取消執行中任務也會取消目前 effect，也就是取消當下的任務。

舉例來說，假設在應用程式生命週期的某個時間點，我們有個待定的呼叫鏈

```javascript
function* main() {
  const task = yield fork(subtask)
  ...
  // 稍候
  yield cancel(task)
}

function* subtask() {
  ...
  yield call(subtask2) // 目前被此呼叫阻塞
  ...
}

function* subtask2() {
  ...
  yield call(someApi) // 目前被此呼叫阻塞
  ...
}
```

`yield cancel(task)` 將觸發取消 `subtask` ，接著觸發取消 `subtask2`。`SagaCancellationException` 將會拋到 `subtask2` 之中，接著拋到 `subtask` 之中。如果 `subtask` 省略對取消例外的處理，它將會傳播到 `main`。

取消例外的主要用意在於，讓被取消的任務可以執行清理邏輯。這讓應用程式不會在狀態不一致狀況下離開，在上述背景同步的範例中，透過捕獲取消例外，`bgSync` 能夠分派 `requestFailure` action 到 store。否則，store 可能留下一種不一致的狀態（例如，等候待定請求的結果）

>很重要的一件事，請記住 `yield cancel(task)` 並不會等候被取消的任務完成（即執行 catch 內的區塊）。cancel effect 行為像是 fork。一旦 cancel 被初始化之後便會返回。
>一旦取消，一般情況下，清理的邏輯要盡快完成。某些情況下，清理的邏輯可能牽涉某些非同步的操作，但取消的任務是存在分開的 process，沒有辦法 rejoin 回到主要的控制流程（除了透過 Redux store 分派 actions 到其他任務。然而，這將帶領到複雜的控制流程，難以推理。更好的方式是盡可能的快速結束取消的任務）。

##Automatic cancellation

Besides manual cancellation. There are cases where cancellation is triggered automatically

1- In a `race` effect. All race competitors, except the winner, are automatically cancelled.

2- In a parallel effect (`yield [...]`). The parallel effect is rejected as soon as one of the
sub-effects is rejected (as implied by Promise.all). In this case, all the other sub-effects
are automatically cancelled.

Unlike in manual cancellations, unhandled cancellation exceptions are not propagated to the actual
saga running the race/parallel effect. Nevertheless, a warning is logged into the console in case
a cancelled task omitted to handle a cancellation exception.

#動態啟動 Sagas — runSaga

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

#從原始碼組建範例

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

#在瀏覽器使用 umd 組建

There's an **umd** build of `redux-saga` available in `dist/` folder. Using the umd build `redux-saga` is available as `ReduxSaga` in the window object.
The umd version is useful if you don't use webpack or browserify, you can access it directly from [npmcdn](npmcdn.com).
The following builds are available:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support _es2015 generators_ you must provide a valid polyfill, for example the one provided by *babel*: [browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). The polyfill must be imported before **redux-saga**.
