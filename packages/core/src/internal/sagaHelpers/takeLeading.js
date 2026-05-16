import fsmIterator, { safeName } from './fsmIterator'
import { take, call } from '../io'
import takeSafe from './takeSafe'

const takeUnsafe = take

const takeLeadingCreator = (takeEffect = takeUnsafe) => {
  return (patternOrChannel, worker, ...args) => {
    const yTake = { done: false, value: takeEffect(patternOrChannel) }
    const yCall = (ac) => ({ done: false, value: call(worker, ...args, ac) })

    let action
    const setAction = (ac) => (action = ac)

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
}

export default takeLeadingCreator()
export const takeLeadingSafe = takeLeadingCreator(takeSafe)
