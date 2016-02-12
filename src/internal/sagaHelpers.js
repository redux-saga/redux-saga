/* eslint-disable no-constant-condition */

import { is, SAGA_ITERATOR } from './utils'
import { take, fork, cancel } from './io'
import SagaCancellationException from './SagaCancellationException'

const resume = (fnOrValue, arg) => is.func(fnOrValue) ? fnOrValue(arg) : fnOrValue
const done = { done: true }

function fsmIterator(fsm, nextState) {
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

  return {
    [SAGA_ITERATOR]: true,
    next,
    throw: error => next(null, error)
  }
}

export function takeEvery(pattern, worker) {
  const yieldTake = { done: false, value: take(pattern)}
  const yieldFork = action => ({ done: false, value: fork(worker, action)})

  return fsmIterator({
    'take' : [yieldTake, 'fork'],
    'fork' : [yieldFork, 'take']
  }, 'take')
}

export function takeLatest(pattern, worker) {
  const yieldTake   = { done: false, value: take(pattern)}
  const yieldFork   = () => ({ done: false, value: fork(worker, currentAction)})
  const yieldCancel = () => ({ done: false, value: cancel(currentTask)})
  const forkOrCancel = () => currentTask ? 'cancel' : 'fork'

  let currentTask, currentAction
  return fsmIterator({
    'take'   : [ yieldTake, forkOrCancel, action => currentAction = action ],
    'cancel' : [yieldCancel, 'fork'],
    'fork'   : [yieldFork, 'take', task => currentTask = task ]
  }, 'take')
}
