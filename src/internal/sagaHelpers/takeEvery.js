import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { take, fork } from '../io'
import { END } from '../channel'
import { check, is } from '../utils'

export default function takeEvery(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV === 'development') {
    check(worker, is.notUndef, `${takeEvery.name} requires a saga parameter`)
  }

  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })

  let action,
    setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return ['q2', yTake, setAction]
      },
      q2() {
        return action === END ? [qEnd] : ['q1', yFork(action)]
      },
    },
    'q1',
    `takeEvery(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
