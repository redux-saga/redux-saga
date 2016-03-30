import { is, check, noop } from './utils'
import proc from './proc'

export const NOT_ITERATOR_ERROR = "runSaga must be called on an iterator"

export function runSaga(
  iterator,
  {
    subscribe,
    dispatch,
    getState
  },
  monitor = noop
) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  return proc(
    iterator,
    subscribe,
    dispatch,
    getState,
    monitor
  )
}
