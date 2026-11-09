import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'
import rootSaga from './sagas'
import Counter from './components/Counter'

const sagaMiddleware = createSagaMiddleware()
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
})
sagaMiddleware.run(rootSaga)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <Counter />
  </Provider>,
)
