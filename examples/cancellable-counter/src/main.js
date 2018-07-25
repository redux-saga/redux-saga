import '@babel/polyfill'

import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import sagaMonitor from 'saga-monitor-example'

import reducer from './reducers'
import rootSaga from './sagas'
import Counter from './components/Counter'

const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
const store = createStore(reducer, applyMiddleware(sagaMiddleware))
sagaMiddleware.run(rootSaga)

render(
  <Provider store={store}>
    <Counter />
  </Provider>,
  document.getElementById('root'),
)
