import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { Router, RouterContext } from 'react-router'
import DevTools from './DevTools'

export default class Root extends Component {
  render() {
    const { store, history, routes, type, renderProps } = this.props

    return (
      <Provider store={store}>
        <div>
          {type === 'server' ? <RouterContext {...renderProps} /> : <Router history={history} routes={routes} />}
          <DevTools />
        </div>
      </Provider>
    )
  }
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  routes: PropTypes.node.isRequired,
  type: PropTypes.string.isRequired,
  renderProps: PropTypes.any.isRequired,
}
