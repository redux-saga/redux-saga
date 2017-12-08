import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { take, fork, actionChannel, delay } from '../io'
import { END } from '../channel'
import { check, is } from '../utils'
import * as buffers from '../buffers'

export default function throttle(delayLength, pattern, worker, ...args) {
  if (process.env.NODE_ENV === 'development') {
    check(worker, is.notUndef, `${throttle.name} requires a saga parameter`)
  }

  let action, channel

  const yActionChannel = { done: false, value: actionChannel(pattern, buffers.sliding(1)) }
  const yTake = () => ({ done: false, value: take(channel) })
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yDelay = { done: false, value: delay(delayLength) }

  const setAction = ac => (action = ac)
  const setChannel = ch => (channel = ch)

  return fsmIterator(
    {
      q1() {
        return ['q2', yActionChannel, setChannel]
      },
      q2() {
        return ['q3', yTake(), setAction]
      },
      q3() {
        return action === END ? [qEnd] : ['q4', yFork(action)]
      },
      q4() {
        return ['q2', yDelay]
      },
    },
    'q1',
    `throttle(${safeName(pattern)}, ${worker.name})`,
  )
}
