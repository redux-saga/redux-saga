import { is, isDev, check } from './utils'
//import asap from './asap'
import proc from './proc'
import {emitter} from './channel'
import { MONITOR_ACTION } from './monitorActions'
import SagaCancellationException from './SagaCancellationException'

export const sagaArgError = (fn, pos, saga) => (`
  ${fn} can only be called on Generator functions
  Argument ${saga} at position ${pos} is not function!
`)

export const MIDDLEWARE_NOT_CONNECTED_ERROR = 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware'

export default function sagaMiddlewareFactory(...sagas) {
  let runSagaDynamically


  function sagaMiddleware({getState, dispatch}) {
    runSagaDynamically = runSaga
    const sagaEmitter = emitter()
    const monitor = isDev ? action => Promise.resolve().then(() => dispatch(action)) : undefined


    function runSaga(saga, ...args) {
      return proc(
        saga(...args),
        sagaEmitter.subscribe,
        dispatch,
        getState,
        monitor,
        0,
        saga.name
      )
    }

    sagas.forEach(saga => runSaga(saga))

    return next => action => {
      const result = next(action) // hit reducers
      // filter out monitor actions to avoid endless loops
      // see https://github.com/yelouafi/redux-saga/issues/61
      if(!action[MONITOR_ACTION])
        sagaEmitter.emit(action)
      return result;
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    if(!runSagaDynamically) {
      throw new Error(MIDDLEWARE_NOT_CONNECTED_ERROR)
    }
    check(saga, is.func, sagaArgError('sagaMiddleware.run', 0, saga))

    const task = runSagaDynamically(saga, ...args)
    task.done.catch(err => {
      if(!(err instanceof SagaCancellationException))
        throw err
    })
    return task
  }

  return sagaMiddleware
}
