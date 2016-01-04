import { is, check, asap } from './utils'
import proc from './proc'
import emitter from './emitter'

export const NOT_ITERATOR_ERROR = "runSaga must be called on an iterator"

function emitterFromStore(store) {
  const storeEmitter = emitter()
  const _dispatch = store.dispatch

  store.dispatch = action => {
    _dispatch(action)
    storeEmitter.emit(action)
  }

  return storeEmitter
}

export function runSaga(iterator, store) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  const sagaEmitter = emitterFromStore(store)
  return proc(
    iterator,
    sagaEmitter.subscribe,
    store.dispatch,
    action => asap(() => store.dispatch(action))
  )
}
