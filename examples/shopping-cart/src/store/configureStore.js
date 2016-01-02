import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../../../src'
import reducer from '../reducers'
import rootSaga from '../sagas'
import sagaMonitor from '../../../sagaMonitor'

const createStoreWithSaga = applyMiddleware(
  sagaMonitor,
  sagaMiddleware(rootSaga)
)(createStore)


export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
