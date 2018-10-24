import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import createSagaMiddleware from 'redux-saga'

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware()
  return {
    ...createStore(rootReducer, applyMiddleware(sagaMiddleware)),
    runSaga: sagaMiddleware.run,
  }
}
