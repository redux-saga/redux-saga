import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import sagaMiddleware from 'redux-saga'
import rootSaga from '..//sagas'
import sagaMonitor from '../../../sagaMonitor'

const createStoreWithMiddleware = applyMiddleware(
  sagaMonitor,
  sagaMiddleware(rootSaga)
)(createStore)

export default function configureStore(initialState) {
  const store = createStoreWithMiddleware(rootReducer, initialState)

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers')
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
