import { is, check, object, createSetContextWarning } from './utils'
import { stdChannel } from './channel'
import { ident } from './utils'
import { runSaga } from './runSaga'

export default function sagaMiddlewareFactory({ context = {}, ...options } = {}) {
  const { sagaMonitor, logger, onError } = options

  if (logger && !is.func(logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!')
  }

  if (process.env.NODE_ENV === 'development' && options.onerror) {
    throw new Error('`options.onerror` was removed. Use `options.onError` instead.')
  }

  if (onError && !is.func(onError)) {
    throw new Error('`options.onError` passed to the Saga middleware is not a function!')
  }

  if (options.emitter && !is.func(options.emitter)) {
    throw new Error('`options.emitter` passed to the Saga middleware is not a function!')
  }

  function sagaMiddleware({ getState, dispatch }) {
    const channel = stdChannel()
    channel.put = (options.emitter || ident)(channel.put)

    sagaMiddleware.run = runSaga.bind(null, {
      context,
      channel: channel,
      dispatch,
      getState,
      sagaMonitor,
      logger,
      onError,
    })

    return next => action => {
      if (sagaMonitor && sagaMonitor.actionDispatched) {
        sagaMonitor.actionDispatched(action)
      }
      const result = next(action) // hit reducers
      channel.put(action)
      return result
    }
  }

  sagaMiddleware.run = () => {
    throw new Error('Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware')
  }

  sagaMiddleware.setContext = props => {
    check(props, is.object, createSetContextWarning('sagaMiddleware', props))
    object.assign(context, props)
  }

  return sagaMiddleware
}
