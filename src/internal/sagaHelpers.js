import { makeIterator, delay, is, deprecate } from './utils'
import { take, fork, cancel, call, actionChannel, race } from './io'
import { buffers } from './buffers'

const done = {done: true, value: undefined}
const nextState = {done: false}
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

function safeName(patternOrChannel) {
  if (is.channel(patternOrChannel)) {
    return 'channel'
  } else if (Array.isArray(patternOrChannel)) {
    return String(patternOrChannel.map(entry => String(entry)))
  } else {
    return String(patternOrChannel)
  }
}

export function debounceHelper(delayLength, pattern, worker, ...args) {
  let action, raceOutput

  const yTake = {done: false, value: take(pattern)}
  const yRace = {
    done: false,
    value: race({
      action: take(pattern),
      debounce: call(delay, delayLength)
    })
  }
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})

  const setAction = ac => action = ac
  const setRaceOutput = ro => raceOutput = ro

  return fsmIterator({
    q1() { return ['q2', yTake, setAction] },
    q2() { return ['q3', yRace, setRaceOutput] },
    q3() { return raceOutput.debounce
      ? ['q1', yFork(action)]
      : ['q4', raceOutput.action, setAction]
    },
    q4() { return ['q2'] }
  }, 'q1', `debounce(${safeName(pattern)}, ${worker.name})`)
}

export function takeEveryHelper(patternOrChannel, worker, ...args) {
  const yTake = {done: false, value: take(patternOrChannel)}
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})

  let action, setAction = ac => action = ac

  return fsmIterator({
    q1() { return ['q2', yTake, setAction] },
    q2() { return ['q1', yFork(action)] }
  }, 'q1', `takeEvery(${safeName(patternOrChannel)}, ${worker.name})`)
}

export function takeLatestHelper(patternOrChannel, worker, ...args) {
  const yTake = {done: false, value: take(patternOrChannel)}
  const yFork = ac => ({done: false, value: fork(worker, ...args, ac)})
  const yCancel = task => ({done: false, value: cancel(task)})

  let task, action;
  const setTask = t => task = t
  const setAction = ac => action = ac

  return fsmIterator({
    q1() { return ['q2', yTake, setAction] },
    q2() { return task ? ['q3', yCancel(task)] : ['q3', nextState] },
    q3() { return ['q1', yFork(action), setTask] }
  }, 'q1', `takeLatest(${safeName(patternOrChannel)}, ${worker.name})`)
}

export function throttleHelper(delayLength, pattern, worker, ...args) {
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
    q3() { return ['q4', yFork(action)] },
    q4() { return ['q2', yDelay] }
  }, 'q1', `throttle(${safeName(pattern)}, ${worker.name})`)
}

let deprecationWarning = (helperName) =>
  `import ${ helperName } from 'redux-saga' has been deprecated in favor of import ${ helperName } from 'redux-saga/effects'`

if(process.env.NODE_ENV !== 'production') {
  deprecationWarning = (helperName) =>
    `import ${ helperName } from 'redux-saga' has been deprecated in favor of import ${ helperName } from 'redux-saga/effects'.
The latter will not work with yield*, as helper effects are wrapped automatically for you in fork effect.
Therefore yield ${ helperName } will return task descriptor to your saga and execute next lines of code.`
}

export const takeEvery = deprecate(takeEveryHelper, deprecationWarning('takeEvery'))
export const takeLatest = deprecate(takeLatestHelper, deprecationWarning('takeLatest'))
export const throttle = deprecate(throttleHelper, deprecationWarning('throttle'))
