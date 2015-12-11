import { createStore, applyMiddleware } from 'redux'
import createLogger from 'redux-logger'
import sagaMiddleware from '../../../../src'
import reducer from '../reducers'
import sagas from '../sagas'

const createStoreWithSaga = applyMiddleware(
  createLogger(),
  sagaMiddleware(...sagas)
)(createStore)


export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
