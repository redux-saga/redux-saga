import * as is from '@redux-saga/is'
import { makeIterator } from '../utils'

const done = value => ({ done: true, value })
export const qEnd = {}

export function safeName(patternOrChannel) {
  if (is.channel(patternOrChannel)) {
    return 'channel'
  }

  if (is.stringableFunc(patternOrChannel)) {
    return String(patternOrChannel)
  }

  if (is.func(patternOrChannel)) {
    return patternOrChannel.name
  }

  return String(patternOrChannel)
}

export default function fsmIterator(fsm, startState, name) {
  let stateUpdater,
    errorState,
    effect,
    nextState = startState

  function next(arg, error) {
    if (nextState === qEnd) {
      return done(arg)
    }
    if (error && !errorState) {
      nextState = qEnd
      throw error
    } else {
      stateUpdater && stateUpdater(arg)
      const currentState = error ? fsm[errorState](error) : fsm[nextState]()
      ;({ nextState, effect, stateUpdater, errorState } = currentState)
      return nextState === qEnd ? done(arg) : effect
    }
  }

  return makeIterator(next, error => next(null, error), name)
}
