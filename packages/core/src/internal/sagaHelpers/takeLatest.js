import fsmIterator, { safeName } from './fsmIterator'
import { cancel, take, fork } from '../io'
import { check, is } from '../utils'

export default function takeLatest(patternOrChannel, worker, ...args) {
  check(patternOrChannel, is.notUndef, 'takeLatest requires a pattern or channel')
  check(worker, is.notUndef, 'takeLatest requires a saga parameter')

  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yCancel = task => ({ done: false, value: cancel(task) })

  let task, action
  const setTask = t => (task = t)
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return task
          ? { nextState: 'q3', effect: yCancel(task) }
          : { nextState: 'q1', effect: yFork(action), stateUpdater: setTask }
      },
      q3() {
        return { nextState: 'q1', effect: yFork(action), stateUpdater: setTask }
      },
    },
    'q1',
    `takeLatest(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
