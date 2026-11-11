import { createRoot } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

import ErrorGenerator from './components/ErrorGenerator'
import reducer from './reducers'
import rootSaga from './sagas'

const sagaMiddleware = createSagaMiddleware()
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
})
sagaMiddleware.run(rootSaga)

const action = (type) => store.dispatch({ type })

createRoot(document.getElementById('root')).render(<ErrorGenerator action={action} />)
