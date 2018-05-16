import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { take, fork } from '../io'
import { END } from '../channel'

export default function takeEvery(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yFork = ac => ({ done: false, value: fork(worker, ...args, ac) })

  let action,
    setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return {nextState: 'q2', effect: yTake, stateUpdater: setAction}
      },
      q2() {
        return action === END ?
          {nextState: qEnd} :
          {nextState: 'q1', effect: yFork(action)}
      },
    },
    'q1',
    `takeEvery(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
