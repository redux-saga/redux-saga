import fsmIterator, { safeName } from './fsmIterator'
import { take, fork } from '../io'
import takeSafe from './takeSafe'

const takeUnsafe = take

const takeEveryCreator = (takeEffect = takeUnsafe) => {
  return (patternOrChannel, worker, ...args) => {
    const yTake = { done: false, value: takeEffect(patternOrChannel) }
    const yFork = (ac) => ({ done: false, value: fork(worker, ...args, ac) })

    let action,
      setAction = (ac) => (action = ac)

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
}

export default takeEveryCreator()
export const takeEverySafe = takeEveryCreator(takeSafe)
