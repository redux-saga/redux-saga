import fsmIterator, { safeName } from './fsmIterator'
import { take, fork } from '../io'
import { check, is } from '../utils'

export default function takeEvery(patternOrChannel, worker, ...args) {
  check(patternOrChannel, is.notUndef, 'takeEvery requires a pattern or channel')
  check(worker, is.notUndef, 'takeEvery requires a saga parameter')

  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })

  let action,
    setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q1', effect: yFork(action) }
      },
    },
    'q1',
    `takeEvery(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
