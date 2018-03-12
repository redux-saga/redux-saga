import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import createSagaMiddleware from 'redux-saga'
import sagaMonitor from '../../../sagaMonitor'

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  return {
    ...createStore(rootReducer, applyMiddleware(sagaMiddleware)),
    runSaga: sagaMiddleware.run,
  }
}
