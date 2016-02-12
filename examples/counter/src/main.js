/*eslint-disable no-unused-vars*/
import "babel-polyfill"

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import Counter from './Components/Counter'
import reducer from './reducers'
import rootSaga from './sagas'


const store = createStore(
  reducer,
  applyMiddleware(createSagaMiddleware(rootSaga))
)

const action = type => store.dispatch({type})

function render() {
  ReactDOM.render(
    <Counter
      value={store.getState()}
      onIncrement={() => action('INCREMENT')}
      onDecrement={() => action('DECREMENT')}
      onIncrementIfOdd={() => action('INCREMENT_IF_ODD')}
      onIncrementAsync={() => action('INCREMENT_ASYNC')} />,      
    document.getElementById('root')
  )
}

render()
store.subscribe(render)
