import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import rootReducer from './reducers'

// Shared by the server and the browser. The caller decides whether and how to run the sagas.
export function createAppStore({ preloadedState, sagaMonitor } = {}) {
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
  })
  return { store, runSaga: sagaMiddleware.run }
}
