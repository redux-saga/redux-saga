import fsmIterator, { qEnd } from './fsmIterator'
import { call, delay } from '../io'

export default function retry(maxTries, delayLength = 0, fn, ...args) {
  let counter = maxTries

  const yCall = ({ done: false, value: call(fn, ...args) })
  const yDelay = { done: false, value: delay(delayLength) }

  return fsmIterator(
    {
      q1() {
        return ['q2', yCall, null, 'q10']
      },
      q2() {
        return [qEnd]
      },
      q10 (error) {
        counter -= 1
        if (counter <= 0) {
          throw error
        }
        return ['q1', yDelay]
      },
    },
    'q1',
    `retry(${fn.name})`,
  )
}
