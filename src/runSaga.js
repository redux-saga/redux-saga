import { is, check, noop, isDev } from './utils'
import proc from './proc'
import emitter from './emitter'

export const NOT_ITERATOR_ERROR = "runSaga must be called on an iterator"

/**
  memoize the result of storeChannel. It avoids monkey patching the same store
  multiple times unnecessarly. We need only one channel per store
**/
const IO = Symbol('IO')
export function storeIO(store) {

  if(isDev) {
    /* eslint-disable no-console */
    console.warn(`storeIO is deprecated, to run Saga dynamically, use 'run' method of the middleware`)
  }

  if(store[IO])
    return store[IO]

  const storeEmitter = emitter()
  const _dispatch = store.dispatch
  store.dispatch = action => {
    const result = _dispatch(action)
    storeEmitter.emit(action)
    return result
  }

  store[IO] = {
    subscribe: storeEmitter.subscribe,
    dispatch : store.dispatch
  }

  return store[IO]
}

export function runSaga(iterator, {subscribe, dispatch}, monitor = noop) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  return proc(
    iterator,
    subscribe,
    dispatch,
    monitor
  )
}
