# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![CDNJS](https://img.shields.io/cdnjs/v/redux-saga.svg)](https://cdnjs.com/libraries/redux-saga)
[![npm](https://img.shields.io/npm/dm/redux-saga.svg)](https://www.npmjs.com/package/redux-saga)
[![Build Status](https://travis-ci.org/redux-saga/redux-saga.svg?branch=master)](https://travis-ci.org/redux-saga/redux-saga)
[![Join the chat at https://gitter.im/yelouafi/redux-saga](https://badges.gitter.im/yelouafi/redux-saga.svg)](https://gitter.im/yelouafi/redux-saga?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![OpenCollective](https://opencollective.com/redux-saga/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/redux-saga/sponsors/badge.svg)](#sponsors)

`redux-saga` は React/Redux アプリケーションにおける副作用（データ通信などの非同期処理、ブラウザキャッシュへのアクセスのようなピュアではない処理）をより簡単で優れたものにするためのライブラリです。

Saga はアプリケーションの中で副作用を個別に実行する独立したスレッドのような動作イメージです。 `redux-saga` は Redux ミドルウェアとして実装されているため、スレッドはメインアプリケーションからのアクションに応じて起動、一時停止、中断が可能で、Redux アプリケーションのステート全体にアクセスでき、Redux アクションをディスパッチすることもできます。

ES6 の Generator 関数を使うことで読み書きしやすく、テストも容易な非同期フローを実現しています（もし馴染みがないようであれば[リンク集](https://redux-saga.js.org/docs/ExternalResources.html)を参考にしてみてください）。それにより非同期フローが普通の同期的な JavaScript のコードのように見えます（`async`/`await` と似ていますが Generator 関数にしかないすごい機能があるんです）。

これまで `redux-thunk` を使ってデータ通信を行っているかもしれませんが、 `redux-thunk` とは異なりコールバック地獄に陥ることなく、非同期フローを簡単にテスト可能にし、アクションをピュアに保ちます。

# はじめよう

## インストール

```sh
$ npm install --save redux-saga
```

または、

```sh
$ yarn add redux-saga
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
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
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
  yield takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

/*
  代わりに takeLatest を使うこともできます。

  しかし、ユーザ情報の並列取得には対応しません。
  もしレスポンス待ちの状態で USER_FETCH_REQUESTED を受け取った場合、
  待ち状態のリクエストはキャンセルされて最後の1つだけが実行されます。
*/
function* mySaga() {
  yield takeLatest("USER_FETCH_REQUESTED", fetchUser);
}

export default mySaga;
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

- [イントロダクション](https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html)
- [基本コンセプト](https://redux-saga.js.org/docs/basics/index.html)
- [応用コンセプト](https://redux-saga.js.org/docs/advanced/index.html)
- [レシピ](https://redux-saga.js.org/docs/recipes/index.html)
- [外部リソース](https://redux-saga.js.org/docs/ExternalResources.html)
- [トラブルシューティング](https://redux-saga.js.org/docs/Troubleshooting.html)
- [用語集](https://redux-saga.js.org/docs/Glossary.html)
- [API リファレンス](https://redux-saga.js.org/docs/api/index.html)

# 翻訳

- [中国語(簡体字)](https://github.com/superRaytin/redux-saga-in-chinese)
- [中国語(繁体字)](https://github.com/neighborhood999/redux-saga)
- [日本語](https://github.com/redux-saga/redux-saga/blob/master/README_ja.md)
- [韓国語](https://github.com/mskims/redux-saga-in-korean)
- [ポルトガル語](https://github.com/joelbarbosa/redux-saga-pt_BR)
- [ロシア語](https://github.com/redux-saga/redux-saga/blob/master/README_ru.md)

# ブラウザで umd ビルドを使用する

`dist/` ディレクトリには `redux-saga` の **umd** ビルドもあります。
umd ビルドを使うときは window オブジェクトに `ReduxSaga` という名前で `redux-saga` が提供されます。
この方法を使用することでES6の`import`シンタックスを用いずにSagaミドルウェアを作成することができます。

```javascript
var sagaMiddleware = ReduxSaga.default()
```

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
$ git clone https://github.com/redux-saga/redux-saga.git
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

# サンプルのテストを実行
$ npm run test-async
```

### real-world サンプル（webpack による hot reloading 付き）

```sh
$ npm run real-world

# まだテストはありません・・・
```

### TypeScript
TypeScriptをRedux Sagaで使用する場合には`DOM.Iterable`か`ES2015.Iterable`が必要になります。
`target`が`ES6`であればすでに設定されている可能性がありますが、`ES5`の場合には手動で追加する必要があります。
`tsconfig.json`ファイルと公式の[コンパイラオプション](https://www.typescriptlang.org/docs/handbook/compiler-options.html)ドキュメントを確認してください。

### ロゴ
様々な種類のRedux Saga公式ロゴが[ロゴディレクトリ](https://github.com/redux-saga/redux-saga/tree/master/logo)にあります。

## Redux Sagaが`async/await`でなくgeneratorsを採択した理由
Redux Sagaがジェネレータの代わりに`async/await`構文を使うように求める[いくつかのissue](https://github.com/redux-saga/redux-saga/issues/987#issuecomment-301039792)が提起されました。

私たちは今後も[ジェネレータ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)を使用します。
`async/await`の主要なメカニズムはPromiseであり、Promiseではスケジューリングの簡素さと既存のSagaのセマンティックを維持させることが難しいためです。
`async/await`ではキャンセルといった特定の事項を許可しません。ですがジェネレータを使用すると作用をいつ、どのように実行するかを完全に制御できます。

## 支援者

毎月の寄付で私たちの開発を援助し、活動を継続できるように支援してください。 \[[支援者になる](https://opencollective.com/redux-saga#backer)\]

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


### スポンサー

スポンサーとしてあなたのサイトへのリンクとなるロゴをGithub上のREADMEに掲載しませんか。 \[[スポンサーになる](https://opencollective.com/redux-saga#sponsor)\]

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
