import delayP from '@redux-saga/delay-p'
import * as is from '@redux-saga/is'
import { IO, SELF_CANCELLATION } from '@redux-saga/symbols'
import { check, createSetContextWarning, identity } from './utils'
import * as effectTypes from './effectTypes'

const TEST_HINT =
  '\n(HINT: if you are getting this errors in tests, consider using createMockTask from @redux-saga/testing-utils)'

const makeEffect = (type, payload) => ({
  [IO]: true,
  // this property makes all/race distinguishable in generic manner from other effects
  // currently it's not used at runtime at all but it's here to satisfy type systems
  combinator: false,
  type,
  payload,
})

const isForkEffect = eff => eff && eff[IO] && eff.type === effectTypes.FORK

export const detach = eff => {
  if (process.env.NODE_ENV !== 'production') {
    check(eff, isForkEffect, 'detach(eff): argument must be a fork effect')
  }
  return makeEffect(effectTypes.FORK, { ...eff.payload, detached: true })
}

export function take(patternOrChannel = '*', multicastPattern) {
  if (process.env.NODE_ENV !== 'production' && arguments.length) {
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
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`take(patternOrChannel): argument ${patternOrChannel} is not valid channel or a valid pattern`)
  }
}

export const takeMaybe = (...args) => {
  const eff = take(...args)
  eff.payload.maybe = true
  return eff
}

export function put(channel, action) {
  if (process.env.NODE_ENV !== 'production') {
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
    // `undefined` instead of `null` to make default parameter work
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
  const eff = makeEffect(effectTypes.ALL, effects)
  eff.combinator = true
  return eff
}

export function race(effects) {
  const eff = makeEffect(effectTypes.RACE, effects)
  eff.combinator = true
  return eff
}

// this match getFnCallDescriptor logic
const validateFnDescriptor = (effectName, fnDescriptor) => {
  check(fnDescriptor, is.notUndef, `${effectName}: argument fn is undefined or null`)

  if (is.func(fnDescriptor)) {
    return
  }

  let context = null
  let fn

  if (is.array(fnDescriptor)) {
    ;[context, fn] = fnDescriptor
    check(fn, is.notUndef, `${effectName}: argument of type [context, fn] has undefined or null \`fn\``)
  } else if (is.object(fnDescriptor)) {
    ;({ context, fn } = fnDescriptor)
    check(fn, is.notUndef, `${effectName}: argument of type {context, fn} has undefined or null \`fn\``)
  } else {
    check(fnDescriptor, is.func, `${effectName}: argument fn is not function`)
    return
  }

  if (context && is.string(fn)) {
    check(context[fn], is.func, `${effectName}: context arguments has no such method - "${fn}"`)
    return
  }

  check(fn, is.func, `${effectName}: unpacked fn argument (from [context, fn] or {context, fn}) is not a function`)
}

function getFnCallDescriptor(fnDescriptor, args) {
  let context = null
  let fn

  if (is.func(fnDescriptor)) {
    fn = fnDescriptor
  } else {
    if (is.array(fnDescriptor)) {
      ;[context, fn] = fnDescriptor
    } else {
      ;({ context, fn } = fnDescriptor)
    }

    if (context && is.string(fn) && is.func(context[fn])) {
      fn = context[fn]
    }
  }

  return { context, fn, args }
}

const isNotDelayEffect = fn => fn !== delay

export function call(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    const arg0 = typeof args[0] === 'number' ? args[0] : 'ms'
    check(
      fnDescriptor,
      isNotDelayEffect,
      `instead of writing \`yield call(delay, ${arg0})\` where delay is an effect from \`redux-saga/effects\` you should write \`yield delay(${arg0})\``,
    )
    validateFnDescriptor('call', fnDescriptor)
  }
  return makeEffect(effectTypes.CALL, getFnCallDescriptor(fnDescriptor, args))
}

export function apply(context, fn, args = []) {
  const fnDescriptor = [context, fn]

  if (process.env.NODE_ENV !== 'production') {
    validateFnDescriptor('apply', fnDescriptor)
  }

  return makeEffect(effectTypes.CALL, getFnCallDescriptor([context, fn], args))
}

export function cps(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    validateFnDescriptor('cps', fnDescriptor)
  }
  return makeEffect(effectTypes.CPS, getFnCallDescriptor(fnDescriptor, args))
}

export function fork(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    validateFnDescriptor('fork', fnDescriptor)
  }
  return makeEffect(effectTypes.FORK, getFnCallDescriptor(fnDescriptor, args))
}

export function spawn(fnDescriptor, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    validateFnDescriptor('spawn', fnDescriptor)
  }
  return detach(fork(fnDescriptor, ...args))
}

export function join(taskOrTasks) {
  if (process.env.NODE_ENV !== 'production') {
    if (arguments.length > 1) {
      throw new Error('join(...tasks) is not supported any more. Please use join([...tasks]) to join multiple tasks.')
    }
    if (is.array(taskOrTasks)) {
      taskOrTasks.forEach(t => {
        check(t, is.task, `join([...tasks]): argument ${t} is not a valid Task object ${TEST_HINT}`)
      })
    } else {
      check(taskOrTasks, is.task, `join(task): argument ${taskOrTasks} is not a valid Task object ${TEST_HINT}`)
    }
  }

  return makeEffect(effectTypes.JOIN, taskOrTasks)
}

export function cancel(taskOrTasks = SELF_CANCELLATION) {
  if (process.env.NODE_ENV !== 'production') {
    if (arguments.length > 1) {
      throw new Error(
        'cancel(...tasks) is not supported any more. Please use cancel([...tasks]) to cancel multiple tasks.',
      )
    }
    if (is.array(taskOrTasks)) {
      taskOrTasks.forEach(t => {
        check(t, is.task, `cancel([...tasks]): argument ${t} is not a valid Task object ${TEST_HINT}`)
      })
    } else if (taskOrTasks !== SELF_CANCELLATION && is.notUndef(taskOrTasks)) {
      check(taskOrTasks, is.task, `cancel(task): argument ${taskOrTasks} is not a valid Task object ${TEST_HINT}`)
    }
  }

  return makeEffect(effectTypes.CANCEL, taskOrTasks)
}

export function select(selector = identity, ...args) {
  if (process.env.NODE_ENV !== 'production' && arguments.length) {
    check(arguments[0], is.notUndef, 'select(selector, [...]): argument selector is undefined')
    check(selector, is.func, `select(selector, [...]): argument ${selector} is not a function`)
  }
  return makeEffect(effectTypes.SELECT, { selector, args })
}

/**
  channel(pattern, [buffer])    => creates a proxy channel for store actions
**/
export function actionChannel(pattern, buffer) {
  if (process.env.NODE_ENV !== 'production') {
    check(pattern, is.pattern, 'actionChannel(pattern,...): argument pattern is not valid')

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
  if (process.env.NODE_ENV !== 'production') {
    check(channel, is.channel, `flush(channel): argument ${channel} is not valid channel`)
  }

  return makeEffect(effectTypes.FLUSH, channel)
}

export function getContext(prop) {
  if (process.env.NODE_ENV !== 'production') {
    check(prop, is.string, `getContext(prop): argument ${prop} is not a string`)
  }

  return makeEffect(effectTypes.GET_CONTEXT, prop)
}

export function setContext(props) {
  if (process.env.NODE_ENV !== 'production') {
    check(props, is.object, createSetContextWarning(null, props))
  }

  return makeEffect(effectTypes.SET_CONTEXT, props)
}

export const delay = call.bind(null, delayP)
