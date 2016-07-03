import { is, check } from './utils'
import proc from './proc'

export function runSaga(
  iterator,
  {
    subscribe,
    dispatch,
    getState,
    monitor,
    logger
  }
) {

  check(iterator, is.iterator, "runSaga must be called on an iterator")

  return proc(
    iterator,
    subscribe,
    dispatch,
    getState,
    {monitor, logger}
  )
}
