<img src='https://redux-saga.js.org/img/Redux-Saga-Logo-Landscape.png' alt='Redux Logo Landscape' width='800px'>

# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![CDNJS](https://img.shields.io/cdnjs/v/redux-saga.svg)](https://cdnjs.com/libraries/redux-saga)
[![npm](https://img.shields.io/npm/dm/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?label=discord&logo=discord)](https://discord.gg/AKz29HvK2h)
[![OpenCollective](https://opencollective.com/redux-saga/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/redux-saga/sponsors/badge.svg)](#sponsors)

`redux-saga` 是一個用來管理應用程式副作用（例如非同步取得資料、存取瀏覽器快取等不純的操作）的函式庫，它的目標是讓這些副作用更容易管理、執行更有效率、更容易測試，並能更好地處理失敗。

可以把它想像成應用中一條專門負責副作用的獨立執行緒。`redux-saga` 是一個 redux 中介軟體，這代表這條執行緒可以透過普通的 redux action 從主應用中啟動、暫停和取消，它能存取完整的 redux 應用狀態，也能派送 redux action。

它使用 ES6 的 Generators（產生器）特性，讓非同步流程易於閱讀、撰寫和測試。_（如果你不熟悉產生器，[這裡有一些入門連結](https://redux-saga.js.org/docs/ExternalResources.html)）_ 如此一來，非同步流程看起來就像標準的同步 JavaScript 程式碼（有點像 `async`/`await`，但產生器擁有一些我們需要的更強大的特性）。

你可能用過 `redux-thunk` 來處理資料取得。與 redux thunk 不同，使用 redux-saga 不會陷入回呼地獄，你可以輕鬆測試非同步流程，而且 action 依然保持純粹。

# 快速上手

## 安裝

```sh
$ npm install redux-saga
```

或者

```sh
$ yarn add redux-saga
```

你也可以直接在 HTML 頁面的 `<script>` 標籤中使用提供的 UMD 建置版本。參見[這一節](#在瀏覽器中使用-umd-建置)。

## 使用範例

假設我們有一個介面，需要在點擊按鈕時從遠端伺服器取得一些使用者資料。（為了簡潔，這裡只展示觸發 action 的程式碼。）

```javascript
class UserComponent extends React.Component {
  ...
  onSomeButtonClicked() {
    const { userId, dispatch } = this.props
    dispatch({type: 'USER_FETCH_REQUESTED', payload: {userId}})
  }
  ...
}
```

這個 Component 向 Store 派送一個普通 Object action。我們將建立一個 Saga，監聽所有 `USER_FETCH_REQUESTED` action，並觸發一個 API 呼叫來取得使用者資料。

#### `sagas.js`

```javascript
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import Api from '...'

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
function* fetchUser(action) {
  try {
    const user = yield call(Api.fetchUser, action.payload.userId)
    yield put({ type: 'USER_FETCH_SUCCEEDED', user: user })
  } catch (e) {
    yield put({ type: 'USER_FETCH_FAILED', message: e.message })
  }
}

/*
  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.
  Allows concurrent fetches of user.
*/
function* mySaga() {
  yield takeEvery('USER_FETCH_REQUESTED', fetchUser)
}

/*
  Alternatively you may use takeLatest.

  Does not allow concurrent fetches of user. If "USER_FETCH_REQUESTED" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.
*/
function* mySaga() {
  yield takeLatest('USER_FETCH_REQUESTED', fetchUser)
}

export default mySaga
```

要執行我們的 Saga，需要透過 `redux-saga` 中介軟體將它連接到 Redux Store。

#### `main.js`

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()
// mount it on the Store
const store = createStore(reducer, applyMiddleware(sagaMiddleware))

// then run the saga
sagaMiddleware.run(mySaga)

// render the application
```

# 文件

- [入門](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)
- [基礎概念](https://redux-saga.js.org/docs/basics/DeclarativeEffects)
- [進階概念](https://redux-saga.js.org/docs/advanced/Channels)
- [技巧](https://redux-saga.js.org/docs/recipes/index.html)
- [外部資源](https://redux-saga.js.org/docs/ExternalResources.html)
- [疑難排解](https://redux-saga.js.org/docs/Troubleshooting.html)
- [術語表](https://redux-saga.js.org/docs/Glossary.html)
- [API 參考](https://redux-saga.js.org/docs/api/index.html)

# 翻譯

- [中文（簡體）](https://github.com/superRaytin/redux-saga-in-chinese)
- [中文（繁體）](https://github.com/neighborhood999/redux-saga)
- [日文](https://github.com/redux-saga/redux-saga/blob/main/README_ja.md)
- [韓文](https://github.com/mskims/redux-saga-in-korean)
- [葡萄牙文](https://github.com/joelbarbosa/redux-saga-pt_BR)
- [俄文](https://github.com/redux-saga/redux-saga/blob/main/README_ru.md)

# 在瀏覽器中使用 umd 建置

`dist/` 目錄中也提供了 `redux-saga` 的 **umd** 建置版本。使用 umd 建置時，`redux-saga` 會以 `ReduxSaga` 的名字掛在 window 物件上。這樣你無需 ES6 `import` 語法即可建立 Saga 中介軟體：

```javascript
var sagaMiddleware = ReduxSaga.default()
```

如果你不使用 Webpack 或 Browserify，umd 版本會很有用。你可以直接從 [unpkg](https://unpkg.com/) 取得。

可用的建置版本：

- [https://unpkg.com/redux-saga/dist/redux-saga.umd.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.js)
- [https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js)

**重要！** 如果目標瀏覽器不支援 _ES2015 產生器_，你必須對程式碼進行轉譯（例如使用 [babel 外掛](https://github.com/facebook/regenerator/tree/main/packages/regenerator-transform)）並提供一個有效的執行環境，例如[這個](https://unpkg.com/regenerator-runtime/runtime.js)。該執行環境必須在 **redux-saga** 之前引入：

```javascript
import 'regenerator-runtime/runtime'
// then
import sagaMiddleware from 'redux-saga'
```

# 從原始碼建置範例

```sh
$ git clone https://github.com/redux-saga/redux-saga.git
$ cd redux-saga
$ pnpm install
$ pnpm test
```

以下是目前已從 Redux 各儲存庫移植過來的範例。

### 計數器範例

有三個計數器範例。

#### counter-vanilla

使用原生 JavaScript 和 UMD 建置的示範。所有原始碼都內嵌在 `index.html` 中。

要啟動該範例，在瀏覽器中開啟 `index.html` 即可。

> 重要：你的瀏覽器必須支援 Generators。最新版本的 Chrome/Firefox/Edge 皆可。

#### counter

使用 `webpack` 和高階 API `takeEvery` 的示範。

```sh
$ npm run counter

# test sample for the generator
$ npm run test-counter
```

#### cancellable-counter

使用底層 API 示範任務取消的範例。

```sh
$ npm run cancellable-counter
```

### 購物車範例

```sh
$ npm run shop

# test sample for the generator
$ npm run test-shop
```

### async 範例

```sh
$ npm run async

# test sample for the generators
$ npm run test-async
```

### real-world 範例（帶 webpack 熱重載）

```sh
$ npm run real-world

# sorry, no tests yet
```

### TypeScript

在 Redux-Saga 中使用 TypeScript 需要 `DOM.Iterable` 或 `ES2015.Iterable`。如果你的 `target` 是 `ES6`，通常已經滿足；如果是 `ES5`，則需要自行新增。
請檢查你的 `tsconfig.json` 檔案以及官方的<a href="https://www.typescriptlang.org/docs/handbook/compiler-options.html">編譯器選項</a>文件。

### Logo

你可以在 [logo 目錄](https://github.com/redux-saga/redux-saga/tree/main/logo)中找到不同風格的官方 Redux-Saga logo。

## Redux Saga 選擇 generators 而非 `async/await`

有不少[issue](https://github.com/redux-saga/redux-saga/issues/1373#issuecomment-381320534)詢問 Redux Saga 是否計劃改用 `async/await` 語法取代 generators。

我們將繼續使用 [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)。`async/await` 的核心機制是 Promise，而用 Promise 很難保持現有 Saga 概念的排程簡潔性與語義。`async/await` 無法實現某些能力——比如取消。使用 generators 則可以完全掌控 effect 執行的方式與時機。

## 贊助者

歡迎按月捐款，幫助我們持續投入。 \[[成為贊助者](https://opencollective.com/redux-saga#backer)\]

<a href="https://opencollective.com/redux-saga/backer/0/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/1/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/2/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/3/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/4/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/5/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/6/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/7/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/8/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/9/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/10/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/11/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/12/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/13/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/14/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/15/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/16/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/17/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/18/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/19/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/20/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/21/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/22/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/23/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/24/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/25/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/26/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/27/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/28/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/backer/29/website" target="_blank"><img src="https://opencollective.com/redux-saga/backer/29/avatar.svg"></a>

### 贊助商

成為贊助商，讓你的 logo 出現在 GitHub 的 README 中並連結到你的網站。 \[[成為贊助商](https://opencollective.com/redux-saga#sponsor)\]

<a href="https://opencollective.com/redux-saga/sponsor/0/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/1/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/2/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/3/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/4/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/5/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/6/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/7/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/8/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/9/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/10/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/11/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/12/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/13/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/14/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/15/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/16/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/17/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/18/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/19/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/20/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/21/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/22/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/23/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/24/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/25/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/26/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/27/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/28/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/redux-saga/sponsor/29/website" target="_blank"><img src="https://opencollective.com/redux-saga/sponsor/29/avatar.svg"></a>

## License

Copyright (c) 2015 Yassine Elouafi.

Licensed under The MIT License (MIT).
