import { remove } from './utils'
import proc from './proc'
export { take, put, race, call, cps, fork, join } from './io'

export default (...sagas) => ({getState, dispatch}) => {

  const cbs = []

  sagas.forEach( saga => {
    proc(
      saga(getState),
      subscribe,
      dispatch,
      saga.name
    )
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
