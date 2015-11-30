import { createStore, applyMiddleware } from 'redux'
import createLogger from 'redux-logger'
import sagaMiddleware from '../../../../redux-saga'
import timeout from '../middlewares/timeout'
import reducer from '../reducers'
import saga from '../sagas'

const createStoreWithSaga = applyMiddleware(
  createLogger(),
  timeout,
  sagaMiddleware(saga)
)(createStore)

export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
