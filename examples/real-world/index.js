import '@babel/polyfill'
// React imports
import * as React from 'react'
import { render } from 'react-dom'

// app specific imports
import { history } from './services'
import routes from './routes'
import Root from './containers/Root'
import configureStore from './store/configureStore'
import rootSaga from './sagas'

const store = configureStore(window.__INITIAL_STATE__)
store.runSaga(rootSaga)

render(
  <Root
    store={store}
    history={history}
    routes={routes} />,
  document.getElementById('root')
)
