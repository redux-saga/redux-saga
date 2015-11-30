import { createStore, applyMiddleware } from 'redux'
import createLogger from 'redux-logger'
import sagaMiddleware from '../../../../redux-saga'
import reducer from '../reducers'
import sagaFactory from '../sagas'
import { api } from '../services'

const createStoreWithSaga = applyMiddleware(
  createLogger(),
  sagaMiddleware(sagaFactory(api))
)(createStore)


export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
