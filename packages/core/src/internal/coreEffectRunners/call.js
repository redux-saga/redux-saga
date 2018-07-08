import { is } from '../utils'
import { getMetaInfo } from '../error-utils'

export default function runCallEffect(env, { context, fn, args }, cb, { effectId, resolvePromise, resolveIterator }) {
  let result
  // catch synchronous failures; see #152
  try {
    result = fn.apply(context, args)
  } catch (error) {
    cb(error, true)
    return
  }

  if (is.promise(result)) {
    resolvePromise(result, cb)
  } else if (is.iterator(result)) {
    resolveIterator(result, effectId, getMetaInfo(fn), cb)
  } else {
    cb(result)
  }
}
