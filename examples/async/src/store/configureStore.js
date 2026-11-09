import { configureStore as createStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import rootReducer from '../reducers'

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware()
  return {
    ...createStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
    }),
    runSaga: sagaMiddleware.run,
  }
}
