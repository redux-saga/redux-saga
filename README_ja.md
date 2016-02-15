# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

もう１つの Redux アプリケーションのための副作用モデル。redux-thunk ミドルウェアによって処理される thunk の代わりに
すべての副作用を伴うロジックを１箇所にまとめる **Saga** を作成します。

これはアプリケーションロジックが２箇所に存在することを意味します:

- Reducer は action ごとの状態遷移を処理する責任を持つ

- Saga は複雑で非同期な操作のオーケストレーションに責任を持つ

Saga は Generator 関数を使って作成されます。

> このドキュメントで見ていくように Generator は ES7 の async 関数より低レイヤーなので、
async 関数では不可能ではないにせよ実装困難な宣言的な作用とキャンセルのような機能を可能にします。

このミドルウェアは以下を提案します:

- 構成可能な抽象的な **作用**: action を待って、store に action を送り出して状態の更新を発生させ、
  リモートサービスを呼び出すことはすべて作用の異なる形態です。
  Saga はそれらの作用を慣れ親しんだ制御構造（if, while, for, try/catch）で構成します。

- Saga はそれ自身が作用です。コンビネータを使って他の作用と結合可能です。また他の Saga の内部から呼び出すこともでき、サブルーチンと
  [構造化プログラミング](https://ja.wikipedia.org/wiki/%E6%A7%8B%E9%80%A0%E5%8C%96%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0)
  の効果を提供します。

- *[訳注: 意味不明]* 作用は宣言的に生成できます。ミドルウェアに実行させる作用の記述を生成します。
  これにより Generator 内部にある操作のロジックがテスト可能になります。

- 複数の action にまたがる複雑な操作を実装できます（例: ログイン後の処理、ウィザードダイアログ、複雑なゲームルール、など）。
  これらは作用を扱う他のミドルウェアでも表現することは簡単ではありません。

# インストール

```
npm install redux-saga
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

```
npm run counter

// サンプルのテストを実行
npm run test-counter
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
