import { createStore, applyMiddleware } from 'redux'
import saga from 'redux-saga'
import rootReducer from '../reducers'
import rootSaga from '../sagas'

const finalCreateStore = applyMiddleware(saga(rootSaga))(createStore)

export default function configureStore(initialState) {
  return finalCreateStore(rootReducer, initialState)
}
