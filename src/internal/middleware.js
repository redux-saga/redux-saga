import { is, check } from './utils'
import proc from './proc'
import {emitter} from './channel'


export default function sagaMiddlewareFactory(options={}) {
  let runSagaDynamically


  if(is.func(options)) {
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

  function sagaMiddleware({getState, dispatch}) {
    runSagaDynamically = runSaga
    const sagaEmitter = emitter()
    let liftedNext

    function runSaga(saga, ...args) {
      return proc(
        saga(...args),
        sagaEmitter.subscribe,
        dispatch,
        getState,
        liftedNext,
        options.sagaMonitor,
        0,
        saga.name
      )
    }

    return next => {
      liftedNext = next
      return action => {
        const result = next(action) // hit reducers
        sagaEmitter.emit(action)
        return result;
      }
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    check(runSagaDynamically, is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware')
    check(saga, is.func, `sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!`)
    return runSagaDynamically(saga, ...args)
  }

  return sagaMiddleware
}
