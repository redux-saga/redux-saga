# redux-saga

[![npm version](https://img.shields.io/npm/v/redux-saga.svg?style=flat-square)](https://www.npmjs.com/package/redux-saga)

An alternative Side Effects middleware (aka Asynchronous Actions) for Redux applications.
Instead of dispatching Thunks which get handled by the `redux-thunk` middleware, you
create *Sagas* to gather all your Side Effects logic in a central place.

This means the logic of the application lives in 2 places:

- Reducers are responsible for handling state transitions between actions

- Sagas are responsible for orchestrating complex/asynchronous operations.

Sagas are created using Generator functions. If you're not familiar with them you may find
[some useful links here](http://yelouafi.github.io/redux-saga/docs/ExternalResources.html)

Unlike Thunks which get invoked on every action by Action Creators. Sagas are fired only
once at the start of the application (but startup Sagas may fire other Sagas dynamically).
They can be seen as Processes running in the background. Sagas watch the actions dispatched
to the Store, then decide what to do based on dispatched actions : Either making an asynchronous
call (like an AJAX request), dispatching other actions to the Store or even starting other
Sagas dynamically.

In `redux-saga` all the above tasks are achieved by yielding **Effects**. Effects are simply
JavaScript Objects containing instructions to be executed by the Saga middleware (As an analogy,
you can see Redux actions as Objects containing instructions to be executed by the Store).
`redux-saga` provides Effect creators for various tasks like calling an asynchronous function,
dispatching an action to the Store, starting a background task or waiting for a future action
that satisfies a certain condition.

The fact that Sagas yield plain Objects make it easy to test all the logic inside your Generator
by simply iterating over the yielded Objects and doing simple equality tests.


# Getting started

## Install

```
npm install --save redux-saga
```

There are also browser bundles which can be included directly in the `<script>` tag of
an HTML page. See [this section](#using-umd-build-in-the-browser)

## Usage Example

Suppose we have an UI to fetch some user data from a remote server when a button is clicked
(For brevity, we'll just show the action triggering code).

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

The Component dispatches a plain Object action to the Store. We'll create a Saga that
watches for all `USER_FETCH_REQUESTED` actions and triggers an API call to fetch the
user data

#### `sagas.js`
```javascript
import { takeEvery } from 'redux-saga'
import { call, put } from 'redux-saga/effects'

import Api from './path/to/Api'

// for every USER_FETCH_REQUESTED action, start a fetchUser task
export default function* rootSaga() {
  yield* takeEvery('USER_FETCH_REQUESTED', fetchUser);
}

// A task to fetch user data and notifies the store on Success/Failure
export function* fetchUser(action) {
   try {
      // call Api.fetchUser and wait for the returned Promise to complete
      const user = yield call(Api.fetchUser, action.payload.userId);

      // if the Promise resolves successfully, dispatch a USER_FETCH_SUCCEEDED action
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (error) {
     // if the Promise is rejected, dispatch a USER_FETCH_FAILED action
      yield put({type: "USER_FETCH_FAILED", message: error.message});
   }
}
```

To run our Saga, we'll have to connect it to the Redux Store using the `redux-saga` middleware

#### `main.js`
```javascript
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from `redux-saga`

import rootReducer from './reducers'
import rootSaga from './sagas'

const sagaMiddleware = createSagaMiddleware(rootSaga)
const store = createStore(
  rootReducer,
  applyMiddleware(sagaMiddleware)
)

// render the application
```

To test the Saga outside the middleware environment, simply iterate over the Generator
using its `next` method, and test.deepEqual the yielded Effects

```javascript
import test from 'tape';

import { put, call } from 'redux-saga/effects'
import { fetchUser } from './sagas'
import Api from './path/to/Api'

test('fetchUser test', assert => {
  const fakeAction = { payload: { userId: 1 } }
  const iterator = fetchUser(fakeAction)

  assert.deepEqual(
    iterator.next().value,
    call(Api.fetchUser, fakeAction.payload.userId),
    'fetchUser Saga must call Api.fetchUser'
  )

  const fakeUser = {}
  assert.deepEqual(
    iterator.next().value,
    put({type: "USER_FETCH_SUCCEEDED", user: fakeUser}),
    'fetchUser Saga must dispatch a USER_FETCH_SUCCEEDED action'
  )

  t.end()
});
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

# Using umd build in the browser

There's also an **umd** build of `redux-saga` available in the `dist/` folder. When using the umd build
`redux-saga` is available as `ReduxSaga` in the window object.

The umd version is useful if you don't use Webpack or Browserify. You can access it directly from [npmcdn](npmcdn.com).

The following builds are available:

- [https://npmcdn.com/redux-saga/dist/redux-saga.js](https://npmcdn.com/redux-saga/dist/redux-saga.js)  
- [https://npmcdn.com/redux-saga/dist/redux-saga.min.js](https://npmcdn.com/redux-saga/dist/redux-saga.min.js)

**Important!** If the browser you are targeting doesn't support _es2015 generators_ you must provide a valid polyfill,
for example the one provided by *babel*:
[browser-polyfill.min.js](https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.25/browser-polyfill.min.js).
The polyfill must be imported before **redux-saga**.

```javascript
import 'babel-polyfill'
// then
import sagaMiddleware from 'redux-saga'
```

# Building examples from sources

```
git clone https://github.com/yelouafi/redux-saga.git
cd redux-saga
npm install
npm test
```

Below are the examples ported (so far) from the Redux repos

### Counter examples

There are 3 counter examples

#### counter-vanilla

Demo using vanilla JavaScript and UMD builds. All source is inlined in `index.html`

To launch the example, just open `index.html` in your browser

>Important
Your browser must support Generators. Latest versions of Chrome/Firefox/Edge are suitable.


#### counter

Demo using webpack and high level API `takeEvery`

```
npm run counter

// test sample for the generator
npm run test-counter
```

#### cancellable-counter

Demo using low level API. Demonstrate task cancellation

```
npm run cancellable-counter
```

### Shopping Cart example

```
npm run shop

// test sample for the generator
npm run test-shop
```

### async example

```
npm run async

//sorry, no tests yet
```

### real-world example (with webpack hot reloading)

```
npm run real-world

//sorry, no tests yet
```
