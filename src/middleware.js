import { asap, isDev } from './utils'
import proc from './proc'
import emitter from './emitter'
import { MONITOR_ACTION } from './monitorActions'


export default (...sagas) => ({getState, dispatch}) => {

  const sagaEmitter = emitter()
  const monitor = isDev ? action => asap(() => dispatch(action)) : undefined

  sagas.forEach( saga => {
    proc(
      saga(getState),
      sagaEmitter.subscribe,
      dispatch,
      monitor,
      0,
      saga.name
    )
  })

  return next => action => {
    const result = next(action) // hit reducers
    // filter out monitor actions to avoid endless loop
    // see https://github.com/yelouafi/redux-saga/issues/61
    if(!action[MONITOR_ACTION])
      sagaEmitter.emit(action)
    return result;
  }



}
