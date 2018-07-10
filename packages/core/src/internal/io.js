import { IO, SELF_CANCELLATION } from './symbols'
import { delay as delayUtil, is, identity, check, createSetContextWarning } from './utils'
import * as effectTypes from './effectTypes'

const TEST_HINT =
  '\n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)'

const makeEffect = (type, payload) => ({ [IO]: true, type, payload })

const isForkEffect = eff => eff && eff[IO] && eff.type === 'FORK'

export const detach = eff => {
  if (process.env.NODE_ENV === 'development') {
    check(eff, isForkEffect, 'detach(eff): argument must be a fork effect')
  }
  eff.payload.detached = true
  return eff
}

export function take(patternOrChannel = '*', multicastPattern) {
  if (process.env.NODE_ENV === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'take(patternOrChannel): patternOrChannel is undefined')
  }
  if (is.pattern(patternOrChannel)) {
    return makeEffect(effectTypes.TAKE, { pattern: patternOrChannel })
  }
  if (is.multicast(patternOrChannel) && is.notUndef(multicastPattern) && is.pattern(multicastPattern)) {
    return makeEffect(effectTypes.TAKE, { channel: patternOrChannel, pattern: multicastPattern })
  }
  if (is.channel(patternOrChannel)) {
    return makeEffect(effectTypes.TAKE, { channel: patternOrChannel })
  }
  throw new Error(`take(patternOrChannel): argument ${patternOrChannel} is not valid channel or a valid pattern`)
}

export const takeMaybe = (...args) => {
  const eff = take(...args)
  eff.payload.maybe = true
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
    channel = undefined
  }
  return makeEffect(effectTypes.PUT, { channel, action })
}

export const putResolve = (...args) => {
  const eff = put(...args)
  eff.payload.resolve = true
  return eff
}

export function all(effects) {
  return makeEffect(effectTypes.ALL, effects)
}

export function race(effects) {
  return makeEffect(effectTypes.RACE, effects)
}

function getFnCallDesc(meth, fn, args) {
  if (process.env.NODE_ENV === 'development') {
    check(fn, is.notUndef, `${meth}: argument fn is undefined`)
  }

  let context = null
  if (is.array(fn)) {
    ;[context, fn] = fn
  } else if (fn.fn) {
    ;({ context, fn } = fn)
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
  return makeEffect(effectTypes.CALL, getFnCallDesc('call', fn, args))
}

export function apply(context, fn, args = []) {
  return makeEffect(effectTypes.CALL, getFnCallDesc('apply', { context, fn }, args))
}

export function cps(fn, ...args) {
  return makeEffect(effectTypes.CPS, getFnCallDesc('cps', fn, args))
}

export function fork(fn, ...args) {
  return makeEffect(effectTypes.FORK, getFnCallDesc('fork', fn, args))
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

  return makeEffect(effectTypes.JOIN, task)
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

  return makeEffect(effectTypes.CANCEL, task || SELF_CANCELLATION)
}

export function select(selector = identity, ...args) {
  if (process.env.NODE_ENV === 'development' && arguments.length) {
    check(arguments[0], is.notUndef, 'select(selector, [...]): argument selector is undefined')
    check(selector, is.func, `select(selector, [...]): argument ${selector} is not a function`)
  }
  return makeEffect(effectTypes.SELECT, { selector, args })
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

  return makeEffect(effectTypes.ACTION_CHANNEL, { pattern, buffer })
}

export function cancelled() {
  return makeEffect(effectTypes.CANCELLED, {})
}

export function flush(channel) {
  if (process.env.NODE_ENV === 'development') {
    check(channel, is.channel, `flush(channel): argument ${channel} is not valid channel`)
  }

  return makeEffect(effectTypes.FLUSH, channel)
}

export function getContext(prop) {
  if (process.env.NODE_ENV === 'development') {
    check(prop, is.string, `getContext(prop): argument ${prop} is not a string`)
  }

  return makeEffect(effectTypes.GET_CONTEXT, prop)
}

export function setContext(props) {
  if (process.env.NODE_ENV === 'development') {
    check(props, is.object, createSetContextWarning(null, props))
  }

  return makeEffect(effectTypes.SET_CONTEXT, props)
}

export const delay = call.bind(null, delayUtil)

const createAsEffectType = type => effect => effect && effect[IO] && effect.type === type && effect.payload

export const asEffect = {
  take: createAsEffectType(effectTypes.TAKE),
  put: createAsEffectType(effectTypes.PUT),
  all: createAsEffectType(effectTypes.ALL),
  race: createAsEffectType(effectTypes.RACE),
  call: createAsEffectType(effectTypes.CALL),
  cps: createAsEffectType(effectTypes.CPS),
  fork: createAsEffectType(effectTypes.FORK),
  join: createAsEffectType(effectTypes.JOIN),
  cancel: createAsEffectType(effectTypes.CANCEL),
  select: createAsEffectType(effectTypes.SELECT),
  actionChannel: createAsEffectType(effectTypes.ACTION_CHANNEL),
  cancelled: createAsEffectType(effectTypes.CANCELLED),
  flush: createAsEffectType(effectTypes.FLUSH),
  getContext: createAsEffectType(effectTypes.GET_CONTEXT),
  setContext: createAsEffectType(effectTypes.SET_CONTEXT),
}
