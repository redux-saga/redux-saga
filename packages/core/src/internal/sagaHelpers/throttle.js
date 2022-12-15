import * as is from '@redux-saga/is'
import fsmIterator, { safeName } from './fsmIterator'
import { take, fork, actionChannel, delay } from '../io'
import * as buffers from '../buffers'

export default function throttle(delayLength, patternOrChannel, worker, ...args) {
  let action, channel

  const yTake = () => ({ done: false, value: take(channel) })
  const yFork = (ac) => ({ done: false, value: fork(worker, ...args, ac) })
  const yDelay = { done: false, value: delay(delayLength) }

  const setAction = (ac) => (action = ac)
  const setChannel = (ch) => (channel = ch)

  const needsChannel = !is.channel(patternOrChannel)

  if (!needsChannel) {
    setChannel(patternOrChannel)
  }

  return fsmIterator(
    {
      q1() {
        const yActionChannel = { done: false, value: actionChannel(patternOrChannel, buffers.sliding(1)) }
        return { nextState: 'q2', effect: yActionChannel, stateUpdater: setChannel }
      },
      q2() {
        return { nextState: 'q3', effect: yTake(), stateUpdater: setAction }
      },
      q3() {
        return { nextState: 'q4', effect: yFork(action) }
      },
      q4() {
        return { nextState: 'q2', effect: yDelay }
      },
    },
    needsChannel ? 'q1' : 'q2',
    `throttle(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
