import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './containers/App'
import configureStore from './store/configureStore'
import rootSaga from './sagas'

const store = configureStore()
store.runSaga(rootSaga)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
