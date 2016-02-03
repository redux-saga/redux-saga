# Getting started

Install
```
npm install redux-saga
```

Create the Saga (using the counter example from Redux)

```javascript
import { take, put } from 'redux-saga'
// sagas/index.js

function* incrementAsync() {

  while(true) {

    // wait for each INCREMENT_ASYNC action  
    const nextAction = yield take(INCREMENT_ASYNC)

    // delay is a sample function
    // return a Promise that resolves after (ms) milliseconds
    yield delay(1000)

    // dispatch INCREMENT_COUNTER
    yield put( increment() )
  }

}

export default [incrementAsync]
```

Plug redux-saga in the middleware pipeline

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
