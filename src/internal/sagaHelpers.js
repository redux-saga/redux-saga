import { END } from './channel'
import { makeIterator } from './utils'
import { take, fork, cancel } from './io'

const done = {done: true, value: undefined}
const qEnd = {}

function fsmIterator(fsm, q0, name = 'iterator') {
  let updateState, qNext = q0

  function next(arg, error) {
    if(qNext === qEnd) {
      return done
    }

    if(error) {
      qNext = qEnd
      throw error
    } else {
      updateState && updateState(arg)
      let [q, output, _updateState] = fsm[qNext]()
      qNext = q
      updateState = _updateState
      return qNext === qEnd ? done : output
    }
  }

  return makeIterator(
    next,
    error => next(null, error),
    name
  )
}

function safeName(pattern) {
  if (Array.isArray(pattern)) {
    return String(pattern.map(entry => String(entry)))
  } else {
    return String(pattern)
  }
}

export function takeEvery(pattern, worker, ...args) {
  const yTake = {done: false, value: take(pattern)}
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})

  let action, setAction = ac => action = ac

  return fsmIterator({
    q1() { return ['q2', yTake, setAction] },
    q2() { return action === END ? [qEnd] : ['q1', yFork(action)] }
  }, 'q1', `takeEvery(${safeName(pattern)}, ${worker.name})`)
}

export function takeLatest(pattern, worker, ...args) {
  const yTake = {done: false, value: take(pattern)}
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})
  const yCancel = task => ({done: false, value: cancel(task)})

  let task, action;
  const setTask = t => task = t
  const setAction = ac => action = ac

  return fsmIterator({
    q1() { return ['q2', yTake, setAction] },
    q2() {
      return action === END
        ? [qEnd]
        : task ? ['q3', yCancel(task)] : ['q1', yFork(action), setTask]
    },
    q3() {
      return ['q1', yFork(action), setTask]
    }
  }, 'q1', `takeLatest(${safeName(pattern)}, ${worker.name})`)
}
