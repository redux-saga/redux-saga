import fsmIterator, { safeName } from './fsmIterator'
import { take, call } from '../io'
import { check, is } from '../utils'

export default function takeLeading(patternOrChannel, worker, ...args) {
  check(patternOrChannel, is.notUndef, 'takeLeading requires a pattern or channel')
  check(worker, is.notUndef, 'takeLeading requires a saga parameter')

  const yTake = { done: false, value: take(patternOrChannel) }
  const yCall = ac => ({ done: false, value: call(worker, ...args, ac) })

  let action
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q1', effect: yCall(action) }
      },
    },
    'q1',
    `takeLeading(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
