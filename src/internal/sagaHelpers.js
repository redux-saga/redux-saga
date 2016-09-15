import { END } from './channel'
import { makeIterator, delay } from './utils'
import { take, fork, cancel, actionChannel, call } from './io'
import { buffers } from './buffers'

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
    name,
    true,
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

export function throttle(delayLength, pattern, worker, ...args) {
  let action, channel

  const yActionChannel = {done: false, value: actionChannel(pattern, buffers.sliding(1))}
  const yTake = () => ({done: false, value: take(channel, pattern)})
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})
  const yDelay = {done: false, value: call(delay, delayLength)}
  
  const setAction = ac => action = ac
  const setChannel = ch => channel = ch

  return fsmIterator({
    q1() { return ['q2', yActionChannel, setChannel] },
    q2() { return ['q3', yTake(), setAction] },
    q3() { return action === END ? [qEnd] : ['q4', yFork(action)] },
    q4() { return ['q2', yDelay] }
  }, 'q1', `throttle(${safeName(pattern)}, ${worker.name})`)
}
