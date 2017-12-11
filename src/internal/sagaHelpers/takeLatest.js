import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { cancel, take, fork } from '../io'
import { END } from '../channel'

export default function takeLatest(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })
  const yCancel = task => ({ done: false, value: cancel(task) })

  let task, action
  const setTask = t => (task = t)
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return ['q2', yTake, setAction]
      },
      q2() {
        return action === END ? [qEnd] : task ? ['q3', yCancel(task)] : ['q1', yFork(action), setTask]
      },
      q3() {
        return ['q1', yFork(action), setTask]
      },
    },
    'q1',
    `takeLatest(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
