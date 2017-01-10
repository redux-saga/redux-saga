import { is, check, isDev, log } from './utils'
import { emitter } from './channel'
import { ident } from './utils'
import { runSaga } from './runSaga'

export default function sagaMiddlewareFactory(options = {}) {
  let runSagaDynamically
  let dispatch
  let getState
  let sagaEmitter
  const {sagaMonitor, logger, onError} = options

  if(is.func(options)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Saga middleware no longer accept Generator functions. Use sagaMiddleware.run instead');
    } else {
      throw new Error(`You passed a function to the Saga middleware. You are likely trying to start a\
        Saga by directly passing it to the middleware. This is no longer possible starting from 0.10.0.\
        To run a Saga, you must do it dynamically AFTER mounting the middleware into the store.
        Example:
          import createSagaMiddleware from 'redux-saga'
          ... other imports

          const sagaMiddleware = createSagaMiddleware()
          const store = createStore(reducer, applyMiddleware(sagaMiddleware))
          sagaMiddleware.run(saga, ...args)
      `)
    }

  }

  if(logger && !is.func(logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!')
  }

  if(options.onerror) {
    if(isDev) log('warn', '`options.onerror` is deprecated. Use `options.onError` instead.')
    options.onError = options.onerror
    delete options.onerror
  }

  if(onError && !is.func(onError)) {
    throw new Error('`options.onError` passed to the Saga middleware is not a function!')
  }

  if(options.emitter && !is.func(options.emitter)) {
    throw new Error('`options.emitter` passed to the Saga middleware is not a function!')
  }

  function sagaMiddleware(store) {
    ({getState, dispatch} = store)
    runSagaDynamically = runSaga
    sagaEmitter = emitter()
    sagaEmitter.emit = (options.emitter || ident)(sagaEmitter.emit);

    return next => action => {
      if(sagaMonitor && sagaMonitor.actionDispatched) {
        sagaMonitor.actionDispatched(action)
      }
      const result = next(action) // hit reducers
      sagaEmitter.emit(action)
      return result
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    check(runSagaDynamically, is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware')
    check(saga, is.func, 'sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!')
    return runSagaDynamically(
      saga,
      {
        subscribe: sagaEmitter.subscribe,
        dispatch,
        getState,
        sagaMonitor,
        logger,
        onError
      },
      ...args
    )
  }

  return sagaMiddleware
}
