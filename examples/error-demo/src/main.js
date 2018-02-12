/*eslint-disable no-unused-vars*/
import '@babel/polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import sagaMonitor from '../../sagaMonitor'

import ErrorGenerator from './components/ErrorGenerator'
import reducer from './reducers'
import rootSaga from './sagas'


const sagaMiddleware = createSagaMiddleware({sagaMonitor})
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)
sagaMiddleware.run(rootSaga)

const action = type => store.dispatch({type})

function render() {
  ReactDOM.render(
    <ErrorGenerator
      value={store.getState()}
      action={action}
    />,
    document.getElementById('root')
  )
}

render()
store.subscribe(render)
