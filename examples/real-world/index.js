import 'babel-polyfill'
// React imports
import React from 'react'
import { render } from 'react-dom'

// app specific imports
import history from './services/history'
import routes from './routes'
import Root from './containers/Root'
import configureStore from './store/configureStore'


const store = configureStore()

requestAnimationFrame(() =>
  render(
    <Root
      store={store}
      history={history}
      routes={routes} />,
    document.getElementById('root')
  )
)
