import { is, makeIterator } from '../utils'

const done = { done: true, value: undefined }
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
    qNext = q0

  function next(arg, error) {
    if (qNext === qEnd) {
      return done
    }

    if (error) {
      qNext = qEnd
      throw error
    } else {
      updateState && updateState(arg)
      let [q, output, _updateState] = fsm[qNext]()
      qNext = q
      updateState = _updateState
      return qNext === qEnd ? done : output
    }
  }

  return makeIterator(next, error => next(null, error), name)
}
