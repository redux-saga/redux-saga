import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import sagaMonitor from '../../../sagaMonitor'
import rootSaga from '../sagas'
import sagaMiddleware from '../../../../src'

const createStoreWithMiddleware = applyMiddleware(
  sagaMonitor,
  sagaMiddleware(rootSaga)
)(createStore)

export default function configureStore(initialState) {
  const store = createStoreWithMiddleware(rootReducer, initialState)
  /*
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers')
      store.replaceReducer(nextRootReducer)
    })
  }
  */
  return store
}
