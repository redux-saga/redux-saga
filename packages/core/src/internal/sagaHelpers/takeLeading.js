import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { take, call } from '../io'
import { END } from '../channel'

export default function takeLeading(patternOrChannel, worker, ...args) {
  const yTake = { done: false, value: take(patternOrChannel) }
  const yCall = ac => ({ done: false, value: call(worker, ...args, ac) })

  let action
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return {nextState: 'q2', effect: yTake, stateUpdater: setAction}
      },
      q2() {
        return action === END ?
          {nextState: qEnd} :
          {nextState: 'q1', effect: yCall(action)}
      },
    },
    'q1',
    `takeLeading(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
