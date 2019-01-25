import fsmIterator, { safeName } from './fsmIterator'
import { call, cancel, fork, take } from '../io'

export default function takeLatestPerKey(patternOrChannel, worker, keySelector, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yCall = ac => ({ done: false, value: call(keySelector, ac) })
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yCancel = task => ({ done: false, value: cancel(task) })

  let tasks = {}
  let action
  let key
  const setTask = k => t => (tasks[k] = t)
  const setAction = ac => (action = ac)
  const setKey = k => (key = k)

  return fsmIterator(
    {
      q1() {
        return { nextState: 'q2', effect: yTake, stateUpdater: setAction }
      },
      q2() {
        return { nextState: 'q3', effect: yCall(action), stateUpdater: setKey }
      },
      q3() {
        return tasks[key]
          ? { nextState: 'q4', effect: yCancel(tasks[key]) }
          : { nextState: 'q1', effect: yFork(action), stateUpdater: setTask(key) }
      },
      q4() {
        return { nextState: 'q1', effect: yFork(action), stateUpdater: setTask(key) }
      },
    },
    'q1',
    `takeLatestPerKey(${safeName(patternOrChannel)}, ${worker.name}, ${keySelector.name})`,
  )
}
