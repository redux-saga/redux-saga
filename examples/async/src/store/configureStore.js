import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import createSagaMiddleware from 'redux-saga'
import rootSaga from '../sagas'
import sagaMonitor from '../../../sagaMonitor'


export default function configureStore(initialState) {
  return createStore(
    rootReducer,
    initialState,
    applyMiddleware(
      sagaMonitor,
      createSagaMiddleware(rootSaga)
    )
  )
}
