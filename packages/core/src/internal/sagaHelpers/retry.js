import fsmIterator, { qEnd } from './fsmIterator'
import { call, delay } from '../io'

export default function retry(maxTries, delayLength, fn, ...args) {
  let counter = maxTries

  const yCall = { done: false, value: call(fn, ...args) }
  const yDelay = { done: false, value: delay(delayLength) }

  return fsmIterator(
    {
      q1() {
        return {nextState: 'q2', effect: yCall, errorState: 'q10'}
      },
      q2() {
        return {nextState: qEnd}
      },
      q10 (error) {
        counter -= 1
        if (counter <= 0) {
          throw error
        }
        return {nextState: 'q1', effect: yDelay}
      },
    },
    'q1',
    `retry(${fn.name})`,
  )
}
