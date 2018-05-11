import { IO, SELF_CANCELLATION } from './symbols'
import { delay as delayUtil, is, identity, check, createSetContextWarning } from './utils'
import { takeEveryHelper, takeLatestHelper, takeLeadingHelper, throttleHelper, retryHelper } from './sagaHelpers'

const TAKE = 'TAKE'
const PUT = 'PUT'
const ALL = 'ALL'
const RACE = 'RACE'
const CALL = 'CALL'
const CPS = 'CPS'
const FORK = 'FORK'
const JOIN = 'JOIN'
const CANCEL = 'CANCEL'
const SELECT = 'SELECT'
const ACTION_CHANNEL = 'ACTION_CHANNEL'
const CANCELLED = 'CANCELLED'
const FLUSH = 'FLUSH'
const GET_CONTEXT = 'GET_CONTEXT'
const SET_CONTEXT = 'SET_CONTEXT'

const TEST_HINT =
  '\n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)'

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

export const detach = eff => {
  if (process.env.NODE_ENV === 'development') {
    check(asEffect.fork(eff), is.object, 'detach(eff): argument must be a fork effect')
  }
  eff[FORK].detached = true
  return eff
}

export function take(patternOrChannel = '*', multicastPattern) {
  if (process.env.NODE_ENV === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'take(patternOrChannel): patternOrChannel is undefined')
  }
  if (is.pattern(patternOrChannel)) {
    return effect(TAKE, { pattern: patternOrChannel })
  }
  if (is.multicast(patternOrChannel) && is.notUndef(multicastPattern) && is.pattern(multicastPattern)) {
    return effect(TAKE, { channel: patternOrChannel, pattern: multicastPattern })
  }
  if (is.channel(patternOrChannel)) {
    return effect(TAKE, { channel: patternOrChannel })
  }
  throw new Error(`take(patternOrChannel): argument ${patternOrChannel} is not valid channel or a valid pattern`)
}

export const takeMaybe = (...args) => {
  const eff = take(...args)
  eff[TAKE].maybe = true
  return eff
}

export function put(channel, action) {
  if (process.env.NODE_ENV === 'development') {
    if (arguments.length > 1) {
      check(channel, is.notUndef, 'put(channel, action): argument channel is undefined')
      check(channel, is.channel, `put(channel, action): argument ${channel} is not a valid channel`)
      check(action, is.notUndef, 'put(channel, action): argument action is undefined')
    } else {
      check(channel, is.notUndef, 'put(action): argument action is undefined')
    }
  }
  if (is.undef(action)) {
    action = channel
    channel = null
  }
  return effect(PUT, { channel, action })
}

export const putResolve = (...args) => {
  const eff = put(...args)
  eff[PUT].resolve = true
  return eff
}

export function all(effects) {
  return effect(ALL, effects)
}

export function race(effects) {
  return effect(RACE, effects)
}

function getFnCallDesc(meth, fn, args) {
  if (process.env.NODE_ENV === 'development') {
    check(fn, is.notUndef, `${meth}: argument fn is undefined`)
  }

  let context = null
  if (is.array(fn)) {
    [context, fn] = fn
  } else if (fn.fn) {
    ({ context, fn } = fn)
  }
  if (context && is.string(fn) && is.func(context[fn])) {
    fn = context[fn]
  }

  if (process.env.NODE_ENV === 'development') {
    check(fn, is.func, `${meth}: argument ${fn} is not a function`)
  }

  return { context, fn, args }
}

export function call(fn, ...args) {
  return effect(CALL, getFnCallDesc('call', fn, args))
}

export function apply(context, fn, args = []) {
  return effect(CALL, getFnCallDesc('apply', { context, fn }, args))
}

export function cps(fn, ...args) {
  return effect(CPS, getFnCallDesc('cps', fn, args))
}

export function fork(fn, ...args) {
  return effect(FORK, getFnCallDesc('fork', fn, args))
}

export function spawn(fn, ...args) {
  return detach(fork(fn, ...args))
}

export function join(...tasks) {
  if (tasks.length > 1) {
    return all(tasks.map(t => join(t)))
  }

  const task = tasks[0]

  if (process.env.NODE_ENV === 'development') {
    check(task, is.notUndef, 'join(task): argument task is undefined')
    check(task, is.task, `join(task): argument ${task} is not a valid Task object ${TEST_HINT}`)
  }

  return effect(JOIN, task)
}

export function cancel(...tasks) {
  if (tasks.length > 1) {
    return all(tasks.map(t => cancel(t)))
  }

  const task = tasks[0]

  if (process.env.NODE_ENV === 'development' && tasks.length === 1) {
    check(task, is.notUndef, 'cancel(task): argument task is undefined')
    check(task, is.task, `cancel(task): argument ${task} is not a valid Task object ${TEST_HINT}`)
  }

  return effect(CANCEL, task || SELF_CANCELLATION)
}

export function select(selector = identity, ...args) {
  if (process.env.NODE_ENV === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'select(selector, [...]): argument selector is undefined')
    check(selector, is.func, `select(selector, [...]): argument ${selector} is not a function`)
  }
  return effect(SELECT, { selector, args })
}

/**
  channel(pattern, [buffer])    => creates a proxy channel for store actions
**/
export function actionChannel(pattern, buffer) {
  if (process.env.NODE_ENV === 'development') {
    check(pattern, is.notUndef, 'actionChannel(pattern,...): argument pattern is undefined')

    if (arguments.length > 1) {
      check(buffer, is.notUndef, 'actionChannel(pattern, buffer): argument buffer is undefined')
      check(buffer, is.buffer, `actionChannel(pattern, buffer): argument ${buffer} is not a valid buffer`)
    }
  }

  return effect(ACTION_CHANNEL, { pattern, buffer })
}

export function cancelled() {
  return effect(CANCELLED, {})
}

export function flush(channel) {
  if (process.env.NODE_ENV === 'development') {
    check(channel, is.channel, `flush(channel): argument ${channel} is not valid channel`)
  }

  return effect(FLUSH, channel)
}

export function getContext(prop) {
  if (process.env.NODE_ENV === 'development') {
    check(prop, is.string, `getContext(prop): argument ${prop} is not a string`)
  }

  return effect(GET_CONTEXT, prop)
}

export function setContext(props) {
  if (process.env.NODE_ENV === 'development') {
    check(props, is.object, createSetContextWarning(null, props))
  }

  return effect(SET_CONTEXT, props)
}

export function takeEvery(patternOrChannel, worker, ...args) {
  return fork(takeEveryHelper, patternOrChannel, worker, ...args)
}

export function takeLatest(patternOrChannel, worker, ...args) {
  return fork(takeLatestHelper, patternOrChannel, worker, ...args)
}

export function takeLeading(patternOrChannel, worker, ...args) {
  return fork(takeLeadingHelper, patternOrChannel, worker, ...args)
}

export function throttle(ms, pattern, worker, ...args) {
  return fork(throttleHelper, ms, pattern, worker, ...args)
}

export function retry(maxTries, delayLength, worker, ...args) {
  return call(retryHelper, maxTries, delayLength, worker, ...args)
}

export const delay = call.bind(null, delayUtil)

const createAsEffectType = type => effect => effect && effect[IO] && effect[type]

export const asEffect = {
  take: createAsEffectType(TAKE),
  put: createAsEffectType(PUT),
  all: createAsEffectType(ALL),
  race: createAsEffectType(RACE),
  call: createAsEffectType(CALL),
  cps: createAsEffectType(CPS),
  fork: createAsEffectType(FORK),
  join: createAsEffectType(JOIN),
  cancel: createAsEffectType(CANCEL),
  select: createAsEffectType(SELECT),
  actionChannel: createAsEffectType(ACTION_CHANNEL),
  cancelled: createAsEffectType(CANCELLED),
  flush: createAsEffectType(FLUSH),
  getContext: createAsEffectType(GET_CONTEXT),
  setContext: createAsEffectType(SET_CONTEXT),
}
