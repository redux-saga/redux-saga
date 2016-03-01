/*eslint-disable no-unused-vars*/
import "babel-polyfill"

import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import sagaMonitor from '../../sagaMonitor'

import rootReducer from './reducers'
import rootSaga from './sagas'
import Counter from './components/Counter'


const store = createStore(
  rootReducer,
  applyMiddleware(
    sagaMonitor,
    createSagaMiddleware(rootSaga)
  )
)

render(
  <Provider store={store}>
    <Counter />
  </Provider>,
  document.getElementById('root')
)
