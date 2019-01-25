import fsmIterator, { safeName } from './fsmIterator'
import { call, fork, take } from '../io'

export default function takeLeadingPerKey(patternOrChannel, worker, keySelector, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yCall = ac => ({ done: false, value: call(keySelector, ac) })
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })

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
        return tasks[key] && tasks[key].isRunning()
          ? { nextState: 'q2', effect: yTake, stateUpdater: setAction }
          : { nextState: 'q1', effect: yFork(action), stateUpdater: setTask(key) }
      },
    },
    'q1',
    `takeLeadingPerKey(${safeName(patternOrChannel)}, ${worker.name}, ${keySelector.name})`,
  )
}
