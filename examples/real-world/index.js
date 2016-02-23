import 'babel-polyfill'
// React imports
import React from 'react'
import { render } from 'react-dom'

// app specific imports
import { browserHistory } from 'react-router'
import routes from './routes'
import Root from './containers/Root'
import configureStore from './store/configureStore'

const store = configureStore()

render(
  <Root
    store={store}
    history={browserHistory}
    routes={routes} />,
  document.getElementById('root')
)
