# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

Redux アプリケーションのための「副作用」ミドルウェア（非同期 action）。`redux-thunk` ミドルウェアによって処理される thunk を送り出す代わりに
副作用を伴うすべてのロジックを１箇所にまとめる **Saga** を用意します。

これはアプリケーションロジックが２箇所に存在することを意味しています:

- Reducer は action ごとの状態遷移を処理する責任を持つ

- Saga は複雑で非同期な操作のオーケストレーションに責任を持つ

Saga は Generator 関数を使って作成されます。もし馴染みがないようであれば[リンク集](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)を参考にしてみてください。

thunk とは異なり action creator によるすべての action に関与します。
Saga が起動するのはアプリケーションの起動時の1回だけです（ただし、Saga の起動によって他の Saga を起動することがあります）。それらはバックグラウンドで実行されるプロセスのように見えます。Saga は store に送り出される action を監視して、その action にもとづいて何をするか決定します: AJAX リクエストのような非同期呼び出しの作成、他の action の送出、 他の Saga の動的な起動など。

`redux-saga` では上記のようなタスクを **作用** を生成することによって実現します。作用は Saga によって実行される手順が含まれた単純な JavaScript のオブジェクトです。例えるなら、Redux の action が store によって実行される手順が含まれているオブジェクトであることに似ています。`redux-saga` は非同期関数を呼び出したり、store に action を送り出したり、バックグラウンドのタスクを起動したり、特定の条件を満たす action を待ち受けたり、様々なタスクのために作用を作成する関数を提供します。

Generator によって `redux-saga` で非同期コードをシンプルな同期スタイルで書き下すことができます。`async/await` 関数によってできることに似ていますが、Generator は `async` 関数では困難ないくつかのことを可能にします。

Saga がプレーンなオブジェクトを生成するということは、生成されたオブジェクトを単純に同値チェックすればよいだけになり、Generator のすべてのロジックをテストしやすくします。

さらに `redux-saga` で開始したタスクは手動・自動（他の作用と競争させてたり）を問わずいつでもキャンセル可能です。

# はじめよう

## インストール

```
npm install redux-saga
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

コンポーネントはプレーンオブジェクトの action を store に送り出します。
`USER_FETCH_REQUESTED` action を監視して、ユーザデータ取得の API 呼び出しを実行する Saga を作ります。

#### `sagas.js`

```javascript
import { takeEvery, takeLatest } from 'redux-saga'
import { call, put } from 'redux-saga/effects'
import Api from '...'

// Saga ワーカー : USER_FETCH_REQUESTED action によって呼び出される
function* fetchUser(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED",message: e.message});
   }
}

/*
  USER_FETCH_REQUESTED action が送出されるたびに fetchUser を開始します。
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

作成した Saga を実行するには `redux-saga` ミドルウェアを使って Redux の store と接続する必要があります。

#### `main.js`
```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from `redux-saga`

import reducer from './reducers'
import mySaga from './sagas'

const sagaMiddleware = createSagaMiddleware(mySaga)
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

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

# ブラウザで umd ビルドを使用する

`dist/` ディレクトリには `redux-saga` の **umd** ビルドもあります。
umd ビルドを使うときは window オブジェクトに `ReduxSaga` という名前で `redux-saga` が提供されます。

umd バージョンは webpack や browserify を使わない場合には便利です。[npmcdn](npmcdn.com) から直接利用できます。

以下のビルドが利用可能です:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**重要!** ターゲットのブラウザが _es2015 の Generator_ をサポートしていない場合、有効な polyfill を提供しなければなりません。
例えば *babel* はそのうちの1つを提供しています:
[browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js)

polyfill は **redux-saga** の前にインポートされなければなりません。

```javascript
import 'babel-polyfill'
// この後に
import sagaMiddleware from 'redux-saga'
```

# サンプルをソースコードからビルドする

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

以下は Redux リポジトリから移植したサンプルです。

### カウンターのサンプル

3つのカウンターのサンプルがあります。

#### counter-vanilla

Vanilla JavaScript と UMD ビルドを使用したデモです。すべてのソースコードは `index.html` にインラインで埋め込まれています。

単純に `index.html` をブラウザで開くだけでサンプルを実行できます。

>重要
ご利用のブラウザが Generator をサポートしている必要があります。
最新の Chrome / Firefox / MS Edge であれば大丈夫です。

#### counter

webpack と高レベル API `takeEvery` を使用したデモです。

```
npm run counter

// サンプルのテストを実行
npm run test-counter
```

#### cancellable-counter

このデモは低レベル API を使用します。 タスクキャンセルのデモです。

```
npm run cancellable-counter
```

### ショッピングカートのサンプル

```
npm run shop

// サンプルのテストを実行
npm run test-shop
```

### 非同期のサンプル

```
npm run async

// またテストはありません・・・
```

### real-world サンプル（webpack の hot reloading 付き）

```
npm run real-world

// またテストはありません・・・
```
