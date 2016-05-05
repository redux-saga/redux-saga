import { is, check, log } from './utils'
import proc from './proc'

export function runSaga(
  iterator,
  {
    subscribe,
    dispatch,
    getState
  },
  monitor
) {

  check(iterator, is.iterator, "runSaga must be called on an iterator")

  return proc(
    iterator,
    subscribe,
    dispatch,
    getState,
    () => log('error', 'putNext has no effect outside of the middleware'),
    monitor
  )
}
