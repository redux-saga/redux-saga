# redux-saga

[![Join the chat at https://gitter.im/yelouafi/redux-saga](https://badges.gitter.im/yelouafi/redux-saga.svg)](https://gitter.im/yelouafi/redux-saga?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

An alternative Side Effects middleware (aka Asynchronous Actions) for Redux applications. Instead of dispatching Thunks which get handled by the `redux-thunk` middleware, you create *Sagas* to gather all your Side Effects logic in a central place.

This means application logic lives in 2 places:

- Reducers are responsible for handling state transitions between actions.
- Sagas are responsible for orchestrating complex/asynchronous operations.

Sagas are created using Generator functions. If you're not familiar with them you may find [some useful links here.](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)

Unlike Thunks which get invoked on every action by Action Creators, Sagas are fired only once at the start of the application (but startup Sagas may fire other Sagas dynamically). They can be seen as Processes running in the background. Sagas watch the actions dispatched to the Store, then decide what to do based on dispatched actions: Either making an asynchronous call (like an AJAX request), dispatching other actions to the Store, or even starting other Sagas dynamically.

In `redux-saga` all the above tasks are achieved by yielding **Effects**. Effects are simply JavaScript Objects containing instructions to be executed by the Saga middleware (As an analogy, you can see Redux actions as Objects containing instructions to be executed by the Store). `redux-saga` provides Effect creators for various tasks like calling an asynchronous function, dispatching an action to the Store, starting a background task or waiting for a future action that satisfies a certain condition.

Using Generators, `redux-saga` allows you to write your asynchronous code in a simple synchronous style. Just like you can do with `async/await` functions. But Generators allow some things that aren't possible with `async` functions.

The fact that Sagas yield plain Objects makes it easy to test all the logic inside your Generator by simply iterating over the yielded Objects and doing simple equality tests.

Furthermore, tasks started in `redux-saga` can be cancelled at any moment either manually or automatically by putting them in a race with other Effects.

# Getting started

## Install

```sh
$ npm install --save redux-saga
```

Alternatively, you may use the provided UMD builds directly in the `<script>` tag of an HTML page. See [this section](#using-umd-build-in-the-browser).

## Usage Example

Suppose we have an UI to fetch some user data from a remote server when a button is clicked. (For brevity, we'll just show the action triggering code.)

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

The Component dispatches a plain Object action to the Store. We'll create a Saga that watches for all `USER_FETCH_REQUESTED` actions and triggers an API call to fetch the user data.

#### `sagas.js`

```javascript
import { takeEvery, takeLatest } from 'redux-saga'
import { call, put } from 'redux-saga/effects'
import Api from '...'

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
function* fetchUser(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED", message: e.message});
   }
}

/*
  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.
  Allows concurrent fetches of user.
*/
function* mySaga() {
  yield* takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

/*
  Alternatively you may use takeLatest.

  Does not allow concurrent fetches of user. If "USER_FETCH_REQUESTED" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.
*/
function* mySaga() {
  yield* takeLatest("USER_FETCH_REQUESTED", fetchUser);
}
```

To run our Saga, we'll have to connect it to the Redux Store using the `redux-saga` middleware.

#### `main.js`

```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()
// mount it on the Store
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

// then run the saga
sagaMiddleware.run(mySaga)

// render the application
```

# Documentation

- [Introduction](http://yelouafi.github.io/redux-saga/docs/introduction/index.html)
- [Basic Concepts](http://yelouafi.github.io/redux-saga/docs/basics/index.html)
- [Advanced Concepts](http://yelouafi.github.io/redux-saga/docs/advanced/index.html)
- [Recipes](http://yelouafi.github.io/redux-saga/docs/recipes/index.html)
- [External Resources](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)
- [Troubleshooting](http://yelouafi.github.io/redux-saga/docs/Troubleshooting.html)
- [Glossary](http://yelouafi.github.io/redux-saga/docs/Glossary.html)
- [API Reference](http://yelouafi.github.io/redux-saga/docs/api/index.html)

There is also a [chinese version of the docs website](https://github.com/superRaytin/redux-saga-in-chinese)
thanks @superRaytin (You may check the referenced version of redux-saga)



# Using umd build in the browser

There is also a **umd** build of `redux-saga` available in the `dist/` folder. When using the umd build `redux-saga` is available as `ReduxSaga` in the window object.

The umd version is useful if you don't use Webpack or Browserify. You can access it directly from [npmcdn](npmcdn.com).

The following builds are available:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support *ES2015 generators*, you must provide a valid polyfill, such as [the one provided by `babel`](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js). The polyfill must be imported before **redux-saga**:

```javascript
import 'babel-polyfill'
// then
import sagaMiddleware from 'redux-saga'
```

# Building examples from sources

```sh
$ git clone https://github.com/yelouafi/redux-saga.git
$ cd redux-saga
$ npm install
$ npm test
```

Below are the examples ported (so far) from the Redux repos.

### Counter examples

There are three counter examples.

#### counter-vanilla

Demo using vanilla JavaScript and UMD builds. All source is inlined in `index.html`.

To launch the example, just open `index.html` in your browser.

> Important: your browser must support Generators. Latest versions of Chrome/Firefox/Edge are suitable.

#### counter

Demo using `webpack` and high-level API `takeEvery`.

```sh
$ npm run counter

# test sample for the generator
$ npm run test-counter
```

#### cancellable-counter

Demo using low-level API to demonstrate task cancellation.

```sh
$ npm run cancellable-counter
```

### Shopping Cart example

```sh
$ npm run shop

# test sample for the generator
$ npm run test-shop
```

### async example

```sh
$ npm run async

# sorry, no tests yet
```

### real-world example (with webpack hot reloading)

```sh
$ npm run real-world

# sorry, no tests yet
```
