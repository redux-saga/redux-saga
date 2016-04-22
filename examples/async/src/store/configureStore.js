import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import createSagaMiddleware from 'redux-saga'
import sagaMonitor from '../../../sagaMonitor'


export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware({sagaMonitor})
  const store = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware)
  )
  store.runSaga = sagaMiddleware.run
  return store
}
