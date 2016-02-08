import { asap, isDev } from './utils'
import proc from './proc'
import emitter from './emitter'
import { MONITOR_ACTION } from './monitorActions'
import SagaCancellationException from './SagaCancellationException'

export const RUN_SAGA_DYNAMIC_ERROR = 'Before running a Saga dynamically using middleware.run, you must mount the Saga middleware on the Store using applyMiddleware'

export default function sagaMiddlewareFactory(...sagas) {
  let runSagaDynamically

  function sagaMiddleware({getState, dispatch}) {

    const sagaEmitter = emitter()
    const monitor = isDev ? action => asap(() => dispatch(action)) : undefined

    function runSaga(saga, ...args) {
      return proc(
        saga(getState, ...args),
        sagaEmitter.subscribe,
        dispatch,
        monitor,
        0,
        saga.name
      )
    }

    runSagaDynamically = runSaga

    sagas.forEach(runSaga)

    return next => action => {
      const result = next(action) // hit reducers
      // filter out monitor actions to avoid endless loop
      // see https://github.com/yelouafi/redux-saga/issues/61
      if(!action[MONITOR_ACTION])
        sagaEmitter.emit(action)
      return result;
    }
  }

  sagaMiddleware.run = (saga, ...args) => {
    if(!runSagaDynamically) {
      throw new Error(RUN_SAGA_DYNAMIC_ERROR)
    }
    const task = runSagaDynamically(saga, ...args)
    task.done.catch(err => {
      if(!(err instanceof SagaCancellationException))
        throw err
    })
    return task
  }

  return sagaMiddleware
}
