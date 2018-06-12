import { array, is, noop, shouldCancel, shouldTerminate } from './utils'
import * as effectTypes from './effectTypes'
import { isEnd } from './channel'

export const shouldComplete = res => isEnd(res) || shouldTerminate(res) || shouldCancel(res)

export function createSelectEffectMiddleware(getState) {
  return next => arg => {
    if (arg.type !== effectTypes.SELECT) {
      return next(arg)
    }
    if (is.undef(getState)) {
      arg.cb(new Error(`${effectTypes.SELECT} effect is only available when getState is defined`), true)
      return
    }
    const { payload, cb } = arg
    const { selector, args } = payload
    try {
      const state = selector(getState(), ...args)
      cb(state)
    } catch (error) {
      cb(error, true)
    }
  }
}

export function allEffectMiddleware(next) {
  return arg => {
    if (arg.type !== effectTypes.ALL) {
      return next(arg)
    }

    const { payload: effects, cb, digestEffect, effectId } = arg
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
}

export function raceEffectMiddleware(next) {
  return arg => {
    if (arg.type !== effectTypes.RACE) {
      return next(arg)
    }

    const { payload: effects, cb, digestEffect, effectId } = arg
    let completed
    const keys = Object.keys(effects)
    const childCbs = {}

    keys.forEach(key => {
      const chCbAtKey = (res, isErr) => {
        if (completed) {
          return
        }

        if (isErr) {
          // Race Auto cancellation
          cb.cancel()
          cb(res, true)
        } else if (!shouldComplete(res)) {
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
}
