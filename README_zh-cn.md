<img src='https://redux-saga.js.org/img/Redux-Saga-Logo-Landscape.png' alt='Redux Logo Landscape' width='800px'>

# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![CDNJS](https://img.shields.io/cdnjs/v/redux-saga.svg)](https://cdnjs.com/libraries/redux-saga)
[![npm](https://img.shields.io/npm/dm/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?label=discord&logo=discord)](https://discord.gg/AKz29HvK2h)
[![OpenCollective](https://opencollective.com/redux-saga/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/redux-saga/sponsors/badge.svg)](#sponsors)

`redux-saga` 是一个用于管理应用程序副作用（例如异步获取数据、访问浏览器缓存等不纯的操作）的库，它的目标是让这些副作用更易管理、执行更高效、测试更简单，并能更好地处理失败。

可以把它想象成应用中一条专门负责副作用的独立线程。`redux-saga` 是一个 redux 中间件，这意味着这条线程可以通过普通的 redux action 从主应用中启动、暂停和取消，它能访问完整的 redux 应用状态，也能派发 redux action。

它使用 ES6 的 Generators（生成器）特性，让异步流程易于阅读、编写和测试。_（如果你不熟悉生成器，[这里有一些入门链接](https://redux-saga.js.org/docs/ExternalResources.html)）_ 这样一来，异步流程看起来就像标准的同步 JavaScript 代码（有点像 `async`/`await`，但生成器拥有一些我们需要的更强大的特性）。

你可能用过 `redux-thunk` 来处理数据获取。与 redux thunk 不同，使用 redux-saga 不会陷入回调地狱，你可以轻松测试异步流程，而且 action 依然保持纯净。

# 快速上手

## 安装

```sh
$ npm install redux-saga
```

或者

```sh
$ yarn add redux-saga
```

你也可以直接在 HTML 页面的 `<script>` 标签中使用提供的 UMD 构建版本。参见[这一节](#在浏览器中使用-umd-构建)。

## 使用示例

假设我们有一个界面，需要在点击按钮时从远程服务器获取一些用户数据。（为了简洁，这里只展示触发 action 的代码。）

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

这个 Component 向 Store 派发一个普通 Object action。我们将创建一个 Saga，监听所有 `USER_FETCH_REQUESTED` action，并触发一个 API 调用来获取用户数据。

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

要运行我们的 Saga，需要通过 `redux-saga` 中间件将它连接到 Redux Store。

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

# 文档

- [入门](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)
- [基础概念](https://redux-saga.js.org/docs/basics/DeclarativeEffects)
- [高级概念](https://redux-saga.js.org/docs/advanced/Channels)
- [技巧](https://redux-saga.js.org/docs/recipes/index.html)
- [外部资源](https://redux-saga.js.org/docs/ExternalResources.html)
- [故障排查](https://redux-saga.js.org/docs/Troubleshooting.html)
- [术语表](https://redux-saga.js.org/docs/Glossary.html)
- [API 参考](https://redux-saga.js.org/docs/api/index.html)

# 翻译

- [中文（简体）](https://github.com/superRaytin/redux-saga-in-chinese)
- [中文（繁体）](https://github.com/neighborhood999/redux-saga)
- [日语](https://github.com/redux-saga/redux-saga/blob/main/README_ja.md)
- [韩语](https://github.com/mskims/redux-saga-in-korean)
- [葡萄牙语](https://github.com/joelbarbosa/redux-saga-pt_BR)
- [俄语](https://github.com/redux-saga/redux-saga/blob/main/README_ru.md)

# 在浏览器中使用 umd 构建

`dist/` 目录中还提供了 `redux-saga` 的 **umd** 构建版本。使用 umd 构建时，`redux-saga` 会以 `ReduxSaga` 的名字挂在 window 对象上。这样你无需 ES6 `import` 语法即可创建 Saga 中间件：

```javascript
var sagaMiddleware = ReduxSaga.default()
```

如果你不使用 Webpack 或 Browserify，umd 版本会很有用。你可以直接从 [unpkg](https://unpkg.com/) 获取。

可用的构建版本：

- [https://unpkg.com/redux-saga/dist/redux-saga.umd.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.js)
- [https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js)

**重要！** 如果目标浏览器不支持 _ES2015 生成器_，你必须对代码进行转译（例如使用 [babel 插件](https://github.com/facebook/regenerator/tree/main/packages/regenerator-transform)）并提供一个有效的运行时，例如[这个](https://unpkg.com/regenerator-runtime/runtime.js)。该运行时必须在 **redux-saga** 之前引入：

```javascript
import 'regenerator-runtime/runtime'
// then
import sagaMiddleware from 'redux-saga'
```

# 从源码构建示例

```sh
$ git clone https://github.com/redux-saga/redux-saga.git
$ cd redux-saga
$ pnpm install
$ pnpm test
```

以下是目前已从 Redux 各仓库移植过来的示例。

### 计数器示例

有三个计数器示例。

#### counter-vanilla

使用原生 JavaScript 和 UMD 构建的演示。所有源码都内联在 `index.html` 中。

要启动该示例，在浏览器中打开 `index.html` 即可。

> 重要：你的浏览器必须支持 Generators。最新版本的 Chrome/Firefox/Edge 均可。

#### counter

使用 `webpack` 和高级 API `takeEvery` 的演示。

```sh
$ npm run counter

# test sample for the generator
$ npm run test-counter
```

#### cancellable-counter

使用底层 API 演示任务取消的示例。

```sh
$ npm run cancellable-counter
```

### 购物车示例

```sh
$ npm run shop

# test sample for the generator
$ npm run test-shop
```

### async 示例

```sh
$ npm run async

# test sample for the generators
$ npm run test-async
```

### real-world 示例（带 webpack 热重载）

```sh
$ npm run real-world

# sorry, no tests yet
```

### TypeScript

在 Redux-Saga 中使用 TypeScript 需要 `DOM.Iterable` 或 `ES2015.Iterable`。如果你的 `target` 是 `ES6`，通常已经满足；如果是 `ES5`，则需要自行添加。
请检查你的 `tsconfig.json` 文件以及官方的<a href="https://www.typescriptlang.org/docs/handbook/compiler-options.html">编译器选项</a>文档。

### Logo

你可以在 [logo 目录](https://github.com/redux-saga/redux-saga/tree/main/logo)中找到不同风格的官方 Redux-Saga logo。

## Redux Saga 选择 generators 而非 `async/await`

有不少[issue](https://github.com/redux-saga/redux-saga/issues/1373#issuecomment-381320534)询问 Redux Saga 是否计划改用 `async/await` 语法代替 generators。

我们将继续使用 [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)。`async/await` 的核心机制是 Promise，而用 Promise 很难保持现有 Saga 概念的调度简洁性与语义。`async/await` 无法实现某些能力——比如取消。使用 generators 则可以完全掌控 effect 执行的方式与时机。

## 赞助者

欢迎按月捐赠，帮助我们持续投入。 \[[成为赞助者](https://opencollective.com/redux-saga#backer)\]

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

### 赞助商

成为赞助商，让你的 logo 出现在 GitHub 的 README 中并链接到你的网站。 \[[成为赞助商](https://opencollective.com/redux-saga#sponsor)\]

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
