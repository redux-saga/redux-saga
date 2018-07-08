import { array, is, noop, shouldComplete } from '../utils'

export default function all(env, effects, cb, { effectId, digestEffect }) {
  const keys = Object.keys(effects)

  if (!keys.length) {
    cb(is.array(effects) ? [] : {})
    return
  }

  let completedCount = 0
  let completed
  const results = {}
  const childCbs = {}

  function checkEffectEnd() {
    if (completedCount === keys.length) {
      completed = true
      cb(is.array(effects) ? array.from({ ...results, length: keys.length }) : results)
    }
  }

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }
      if (isErr || shouldComplete(res)) {
        cb.cancel()
        cb(res, isErr)
      } else {
        results[key] = res
        completedCount++
        checkEffectEnd()
      }
    }
    chCbAtKey.cancel = noop
    childCbs[key] = chCbAtKey
  })

  cb.cancel = () => {
    if (!completed) {
      completed = true
      keys.forEach(key => childCbs[key].cancel())
    }
  }

  keys.forEach(key => digestEffect(effects[key], effectId, key, childCbs[key]))
}
