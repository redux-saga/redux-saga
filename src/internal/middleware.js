import { is, isDev, check, warnDeprecated } from './utils'
import asap from './asap'
import proc from './proc'
import emitter from './emitter'
import { MONITOR_ACTION } from './monitorActions'
import SagaCancellationException from './SagaCancellationException'

export const sagaArgError = (fn, pos, saga) => (`
  ${fn} can only be called on Generator functions
  Argument ${saga} at position ${pos} is not function!
`)

export const RUN_SAGA_DYNAMIC_ERROR = 'Before running a Saga dynamically using middleware.run, you must mount the Saga middleware on the Store using applyMiddleware'

export const GET_STATE_DEPRECATED_WARNING = `
  Using the 'getState' param of Sagas to access the state is deprecated since 0.9.1
  To access the Store's state use 'yield select()' instead
  For more infos see http://yelouafi.github.io/redux-saga/docs/api/index.html#selectselector-args
`

export default function sagaMiddlewareFactory(...sagas) {
  let runSagaDynamically

  sagas.forEach((saga, idx) => check(saga, is.func, sagaArgError('createSagaMiddleware', idx, saga)))

  function sagaMiddleware({getState, dispatch}) {
    const sagaEmitter = emitter()
    const monitor = isDev ? action => asap(() => dispatch(action)) : undefined

    const getStateDeprecated = () => {
      warnDeprecated(GET_STATE_DEPRECATED_WARNING)
      return getState()
    }

    function runSaga(saga, ...args) {
      return proc(
        saga(getStateDeprecated, ...args),
        sagaEmitter.subscribe,
        dispatch,
        getState,
        monitor,
        0,
        saga.name
      )
    }

    runSagaDynamically = runSaga

    asap.suspend()
    Promise.resolve().then(asap.flush)
    sagas.forEach(runSaga)

    return next => action => {
      const result = next(action) // hit reducers
      // filter out monitor actions to avoid endless loops
      // see https://github.com/yelouafi/redux-saga/issues/61
      if(!action[MONITOR_ACTION])
        asap(() => sagaEmitter.emit(action))
      return result;
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    if(!runSagaDynamically) {
      throw new Error(RUN_SAGA_DYNAMIC_ERROR)
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
