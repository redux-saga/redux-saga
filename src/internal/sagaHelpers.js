import { is, makeIterator } from './utils'
import { take, fork, cancel } from './io'
import SagaCancellationException from './SagaCancellationException'

const resume = (fnOrValue, arg) => is.func(fnOrValue) ? fnOrValue(arg) : fnOrValue
const done = { done: true }

function fsmIterator(fsm, nextState, name = 'iterator') {
  let aborted, updateState

  function next(arg, error) {
    if(aborted)
      return  done

    if(error) {
      aborted = true
      if(!(error instanceof SagaCancellationException))
        throw error
      return done
    } else {
      if(updateState)
        updateState(arg)

      const [output, transition, _updateState] = fsm[nextState]
      updateState = _updateState
      nextState = resume(transition, arg)
      return resume(output, arg)
    }
  }

  return makeIterator(
    next,
    error => next(null, error),
    name
  )
}

export function takeEvery(pattern, worker, ...args) {
  const yieldTake = { done: false, value: take(pattern)}
  const yieldFork = action => ({ done: false, value: fork(worker, ...args, action)})
  return fsmIterator({
    'take' : [yieldTake, 'fork'],
    'fork' : [yieldFork, 'take']
  }, 'take', `takeEvery(${String(pattern)}, ${worker.name})`)
}

export function takeLatest(pattern, worker, ...args) {
  const yieldTake   = { done: false, value: take(pattern)}
  const yieldFork   = () => ({ done: false, value: fork(worker, ...args, currentAction)})
  const yieldCancel = () => ({ done: false, value: cancel(currentTask)})
  const forkOrCancel = () => currentTask ? 'cancel' : 'fork'

  let currentTask, currentAction
  return fsmIterator({
    'take'   : [ yieldTake, forkOrCancel, action => currentAction = action ],
    'cancel' : [yieldCancel, 'fork'],
    'fork'   : [yieldFork, 'take', task => currentTask = task ]
  }, 'take', `takeLatest(${String(pattern)}, ${worker.name})`)
}
