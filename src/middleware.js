import { asap } from './utils'
import proc from './proc'
import emitter from './emitter'

export default (...sagas) => ({getState, dispatch}) => {

  const sagaEmitter = emitter()

  sagas.forEach( saga => {
    proc(
      saga(getState),
      sagaEmitter.subscribe,
      dispatch,
      action => asap(() => dispatch(action))
    )
  })

  return next => action => {
    const result = next(action) // hit reducers
    sagaEmitter.emit(action)
    return result;
  }


}
