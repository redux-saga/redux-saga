import { is, check, uid as nextSagaId, wrapSagaDispatch, SAGA_ACTION } from './utils'
import proc from './proc'
import { asap } from './scheduler'
import {emitter} from './channel'


export default function sagaMiddlewareFactory(options = {}) {
  let runSagaDynamically
  const {sagaMonitor} = options

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

  if(options.logger && !is.func(options.logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!')
  }

  if(options.onerror && !is.func(options.onerror)) {
    throw new Error('`options.onerror` passed to the Saga middleware is not a function!')
  }

  function sagaMiddleware({getState, dispatch}) {
    runSagaDynamically = runSaga
    const sagaEmitter = emitter()
    const sagaDispatch = wrapSagaDispatch(dispatch)

    function runSaga(saga, args, sagaId) {
      return proc(
        saga(...args),
        sagaEmitter.subscribe,
        sagaDispatch,
        getState,
        options,
        sagaId,
        saga.name
      )
    }

    return next => action => {
      if(sagaMonitor) {
        sagaMonitor.actionDispatched(action)
      }
      const result = next(action) // hit reducers
      if(action[SAGA_ACTION]) {
        // Saga actions are already scheduled with asap in proc/runPutEffect
        sagaEmitter.emit(action)
      } else {
        asap(() => sagaEmitter.emit(action))
      }

      return result
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    check(runSagaDynamically, is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware')
    check(saga, is.func, 'sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!')

    const effectId = nextSagaId()
    if(sagaMonitor) {
      sagaMonitor.effectTriggered({effectId , root: true, parentEffectId: 0, effect: {root: true, saga, args}})
    }
    const task = runSagaDynamically(saga, args, effectId)
    if(sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task)
    }
    return task
  }

  return sagaMiddleware
}
