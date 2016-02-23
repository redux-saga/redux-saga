import "babel-polyfill"
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import config from './webpack.config'
import express from 'express'
import routes from './routes'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { match } from 'react-router'
import configureStore, { sagaMiddleware } from './store/configureStore'
import DefaultLayout from './layouts/Default'
import Root from './containers/Root'
import waitAll from './sagas/waitAll'

const app = express()
const port = 3000

const compiler = webpack(config)
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }))
app.use(webpackHotMiddleware(compiler))


app.use(function(req, res) {

  const store = configureStore()

  // Note that req.url here should be the full URL path from
  // the original request, including the query string.
  match({routes, location: req.url}, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps && renderProps.components) {

      // Collect all sagas and actions to dispatch before initial load
      const preloaders = renderProps.components
        .filter((component) => component && component['preload'])
        .map((component) => component['preload'](renderProps.params, req))
        .reduce((result, preloader) => result.concat(preloader), [])

      // Run all Sagas in parallel, but resolve after all Sagas are done
      sagaMiddleware.run(
        waitAll(preloaders)
      ).done.then(() => {
        console.log('sagas complete')
        //Render result to browser
        res.status(200).send(
          DefaultLayout(
            renderToString(
              <Root store={store} renderProps={renderProps} type="server"/>
            ),
            JSON.stringify(store.getState())
          )
        )
      }).catch((e) => {
        console.log(e.stack)
      })

    } else {
      res.status(404).send('Not found')
    }
  })
})

app.listen(port, function(error) {
  if (error) {
    console.error(error)
  } else {
    console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
  }
})
