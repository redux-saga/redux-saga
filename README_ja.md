# redux-saga

[![Join the chat at https://gitter.im/yelouafi/redux-saga](https://badges.gitter.im/yelouafi/redux-saga.svg)](https://gitter.im/yelouafi/redux-saga?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

Redux アプリケーションのための副作用ミドルウェア（非同期 Action）。`redux-thunk` ミドルウェアによって処理される Thunk（サンク） を送り出す代わりに、
副作用を伴うすべてのロジックを１箇所にまとめる **Saga（サガ、サーガ）** を用意します。

これはアプリケーションロジックが２箇所に存在することを意味しています:

- Reducer は Action ごとの状態遷移を処理する責任を持つ
- Saga は複雑で非同期的な操作のオーケストレーションに責任を持つ

Saga は Generator 関数を使って作成されます。もし馴染みがないようであれば[リンク集](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)を参考にしてみてください。

Action Creator を呼び出すたびに実行される Thunk とは異なり、Saga が実行されるのはアプリケーション起動時の1回だけです（ただし、最初に起動する Saga が他の Saga を動的に起動することがあります）。それらはバックグラウンドで実行されるプロセスのように見えます。Saga は Store に送り出される Action を監視して、その Action にもとづいて何をするか決定します: AJAX リクエストのような非同期呼び出しの開始、他の Action の送出、 他の Saga の動的な起動など。

`redux-saga` では上記のようなタスクを **作用（Effects）** を生成することによって実現します。作用は `redux-saga` ミドルウェアによって実行される手順が含まれた単純な JavaScript のオブジェクトです。例えるなら、Redux の Action が Store によって実行される手順が含まれているオブジェクトであることに似ています。`redux-saga` は、非同期関数を呼び出したり、Store に Action を送り出したり、バックグラウンドのタスクを起動したり、特定の条件を満たす Action を待ち受けたり、様々なタスクに応じた **作用を生成する関数（Effect Creator）** を提供します。

Generator によって `redux-saga` で非同期コードをシンプルな同期スタイルで書き下すことができます。`async/await` 関数によってできることに似ていますが、Generator は `async` 関数では困難ないくつかのことを可能にします。

Saga がプレーンなオブジェクトを生成するということは、イテレータを回すことで生成されるオブジェクトを単純に同値チェックすればよいだけになり、Generator 内部のすべてのロジックをテストしやすくします。

さらに `redux-saga` で開始したタスクは手動・自動（他の作用と競争させてたり）を問わずいつでもキャンセル可能です。

# はじめよう

## インストール

```sh
$ npm install --save redux-saga
```

別の方法として、UMD ビルドを HTML ページの `<script>` タグで直接使うこともできます。詳しくは[こちら](#ブラウザで-umd-ビルドを使用する).

## 使い方

ボタンがクリックされたらリモートサーバから何らかのユーザデータを取得する UI を考えてみます（簡略化のため、起点となる部分のみ例示します）。

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

コンポーネントはプレーンオブジェクトの Action を Store に送り出します。
`USER_FETCH_REQUESTED` Action を監視して、ユーザデータ取得の API 呼び出しを実行する Saga を作ります。

#### `sagas.js`

```javascript
import { takeEvery, takeLatest } from 'redux-saga'
import { call, put } from 'redux-saga/effects'
import Api from '...'

// ワーカー Saga: USER_FETCH_REQUESTED Action によって起動する
function* fetchUser(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED", message: e.message});
   }
}

/*
  USER_FETCH_REQUESTED Action が送出されるたびに fetchUser を起動します。
  ユーザ情報の並列取得にも対応しています。
*/
function* mySaga() {
  yield* takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

/*
  代わりに takeLatest を使うこともできます。

  しかし、ユーザ情報の並列取得には対応しません。
  もしレスポンス待ちの状態で USER_FETCH_REQUESTED を受け取った場合、
  待ち状態のリクエストはキャンセルされて最後の1つだけが実行されます。
*/
function* mySaga() {
  yield* takeLatest("USER_FETCH_REQUESTED", fetchUser);
}
```

定義した Saga を実行するには `redux-saga` ミドルウェアを使って Redux の Store と接続する必要があります。

#### `main.js`

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// Saga ミドルウェアを作成する
const sagaMiddleware = createSagaMiddleware()

// Store にマウントする
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

// Saga を起動する
sagaMiddleware.run(mySaga)

// アプリケーションのレンダリング
```

# ドキュメント

- [イントロダクション](http://yelouafi.github.io/redux-saga/docs/introduction/index.html)
- [基本コンセプト](http://yelouafi.github.io/redux-saga/docs/basics/index.html)
- [応用コンセプト](http://yelouafi.github.io/redux-saga/docs/advanced/index.html)
- [レシピ](http://yelouafi.github.io/redux-saga/docs/recipes/index.html)
- [外部リソース](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)
- [トラブルシューティング](http://yelouafi.github.io/redux-saga/docs/Troubleshooting.html)
- [用語集](http://yelouafi.github.io/redux-saga/docs/Glossary.html)
- [API リファレンス](http://yelouafi.github.io/redux-saga/docs/api/index.html)

@superRaytin による[中国語のドキュメント](https://github.com/superRaytin/redux-saga-in-chinese)もあります。


# ブラウザで umd ビルドを使用する

`dist/` ディレクトリには `redux-saga` の **umd** ビルドもあります。
umd ビルドを使うときは window オブジェクトに `ReduxSaga` という名前で `redux-saga` が提供されます。

umd バージョンは webpack や browserify を使わない場合には便利です。[unpkg](unpkg.com) から直接利用できます。

以下のビルドが利用可能です:

- [https://unpkg.com/redux-saga/dist/redux-saga.js](https://unpkg.com/redux-saga/dist/redux-saga.js)  
- [https://unpkg.com/redux-saga/dist/redux-saga.min.js](https://unpkg.com/redux-saga/dist/redux-saga.min.js)

**重要!** ターゲットのブラウザが *ES2015 の Generator* をサポートしていない場合、[*babel*](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js) のような有効な polyfill
を提供しなければなりません。

polyfill は **redux-saga** の前にインポートされなければなりません。

```javascript
import 'babel-polyfill'
// この後に
import sagaMiddleware from 'redux-saga'
```

# サンプルをソースコードからビルドする

```sh
$ git clone https://github.com/yelouafi/redux-saga.git
$ cd redux-saga
$ npm install
$ npm test
```

以下は Redux リポジトリから移植したサンプルです。

### カウンターのサンプル

3つのカウンターのサンプルがあります。

#### counter-vanilla

ES2015を使っていない素の JavaScript と UMD ビルドを使用したデモです。すべてのソースコードは `index.html` にインラインで埋め込まれています。

単純に `index.html` をブラウザで開くだけでサンプルを実行できます。

>重要
ご利用のブラウザが Generator をサポートしている必要があります。
最新の Chrome / Firefox / MS Edge であれば大丈夫です。

#### counter

webpack と高レベル API `takeEvery` を使用したデモです。

```sh
$ npm run counter

# サンプルのテストを実行
$ npm run test-counter
```

#### cancellable-counter

低レベル API を使ったタスクのキャンセルのデモです。

```sh
$ npm run cancellable-counter
```

### ショッピングカートのサンプル

```sh
$ npm run shop

# サンプルのテストを実行
$ npm run test-shop
```

### 非同期のサンプル

```sh
$ npm run async

# またテストはありません・・・
```

### real-world サンプル（webpack による hot reloading 付き）

```sh
$ npm run real-world

# またテストはありません・・・
```
