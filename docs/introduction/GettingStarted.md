---
title: Getting Started
hide_title: true
---

# Getting started

## Install

```sh
$ npm install redux-saga
```

or

```sh
$ yarn add redux-saga
```

Alternatively, you may use the provided UMD builds directly in the `<script>` tag of an HTML page. See [this section](#using-umd-build-in-the-browser).

## Usage Example

Suppose we have a UI to fetch some user data from a remote server when a button is clicked. (For brevity, we'll just show the action triggering code.)

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

To run our Saga, we'll have to connect it to the Redux Store using the `redux-saga` middleware.

#### `main.js`

```javascript
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import mySaga from './sagas'

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()
// mount it on the Store
const store = configureStore({
  reducer, 
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
})

// then run the saga
sagaMiddleware.run(mySaga)

// render the application
```

## Using UMD build in the browser

There is also a **UMD** build of `redux-saga` available in the `dist/` folder. When using the umd build `redux-saga` is available as `ReduxSaga` in the window object. This enables you to create Saga middleware without using ES6 `import` syntax like this:

```javascript
var sagaMiddleware = ReduxSaga.default()
```

The UMD version is useful if you don't use Webpack or Browserify. You can access it directly from [unpkg](https://unpkg.com/).

The following builds are available:

- [https://unpkg.com/redux-saga/dist/redux-saga.umd.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.js)
- [https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js](https://unpkg.com/redux-saga/dist/redux-saga.umd.min.js)

**Important!**
If the browser you are targeting doesn't support _ES2015 generators_, you must transpile them (i.e., with [babel plugin](https://github.com/facebook/regenerator/tree/main/packages/transform)) and provide a valid runtime, such as [the one here](https://unpkg.com/regenerator-runtime/runtime.js). The runtime must be imported before **redux-saga**:

```javascript
import 'regenerator-runtime/runtime'
// then
import sagaMiddleware from 'redux-saga'
```
