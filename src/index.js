import { is, remove } from './utils'
import io from './io'
import proc from './proc'

export const SAGA_NOT_A_GENERATOR_ERROR = "Saga must be a Generator function"

export default (...sagas) => ({getState, dispatch}) => {

  const cbs = []

  sagas.forEach( saga => {
    if( !is.generator(saga) )
      throw new Error(SAGA_NOT_A_GENERATOR_ERROR)

    // wait for the current tick, to let other middlewares (e.g. logger) run
    Promise.resolve(1).then(() => {
      proc(
        saga(io, getState),
        subscribe,
        dispatch,
        saga.name
      )
    })
  })

  return next => action => {
    const result = next(action) // hit reducers
    cbs.forEach(cb => cb(action))
    return result;
  }

  function subscribe(cb) {
    cbs.push(cb)
    return () => remove(cbs, cb)
  }
}
