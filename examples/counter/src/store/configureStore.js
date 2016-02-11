import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from '../reducers'
import rootSaga from '../sagas'
import sagaMonitor from '../../../sagaMonitor'

export default function configureStore(initialState) {
  return createStore(
    reducer,
    initialState,
    applyMiddleware(
      sagaMonitor,
      createSagaMiddleware(rootSaga)
    )
  )
}
