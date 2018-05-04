import { is, makeIterator } from '../utils'

const done = (value) => ({ done: true, value })
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

export default function fsmIterator(fsm, q0, name) {
  let updateState,
    onError,
    qNext = q0

  function next(arg, error) {
    if (qNext === qEnd) {
      return done(arg)
    }
    if (error && !onError) {
      qNext = qEnd
      throw error
    } else {
      updateState && updateState(arg)
      const nextState = error ? fsm[onError](error) : fsm[qNext]()
      let [q, output, _updateState, _onError] = nextState
      qNext = q
      updateState = _updateState
      onError = _onError
      return qNext === qEnd ? done(arg) : output
    }
  }

  return makeIterator(next, error => next(null, error), name)
}
