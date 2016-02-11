import { remove } from './utils'

export default function emitter() {

  const cbs = []

  function subscribe(cb) {
    cbs.push(cb)
    return () => remove(cbs, cb)
  }

  function emit(item) {
    cbs.slice().forEach(cb => cb(item))
  }

  return {
    subscribe,
    emit
  }
}
