import { array, is, noop, shouldComplete } from '../utils'

export default function race(env, effects, cb, { effectId, digestEffect }) {
  let completed
  const keys = Object.keys(effects)
  const childCbs = {}

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }

      if (isErr || shouldComplete(res)) {
        // Race Auto cancellation
        cb.cancel()
        cb(res, isErr)
      } else {
        cb.cancel()
        completed = true
        const response = { [key]: res }
        cb(is.array(effects) ? array.from({ ...response, length: keys.length }) : response)
      }
    }
    chCbAtKey.cancel = noop
    childCbs[key] = chCbAtKey
  })

  cb.cancel = () => {
    // prevents unnecessary cancellation
    if (!completed) {
      completed = true
      keys.forEach(key => childCbs[key].cancel())
    }
  }
  keys.forEach(key => {
    if (completed) {
      return
    }
    digestEffect(effects[key], effectId, key, childCbs[key])
  })
}
