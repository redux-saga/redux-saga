import * as effectTypes from '../effectTypes'
import { is } from '../utils'

export default function select(env, { selector, args }, cb) {
  if (is.undef(env.getState)) {
    cb(new Error(`${effectTypes.SELECT} effect is only available when getState is defined`), true)
    return
  }

  try {
    const state = selector(env.getState(), ...args)
    cb(state)
  } catch (error) {
    cb(error, true)
  }
}
