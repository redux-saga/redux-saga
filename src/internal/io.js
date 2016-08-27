import { sym, is, ident, check, TASK } from './utils'

const IO      = sym('IO')
const TAKE    = 'TAKE'
const PUT     = 'PUT'
const RACE    = 'RACE'
const CALL    = 'CALL'
const CPS     = 'CPS'
const FORK    = 'FORK'
const JOIN    = 'JOIN'
const CANCEL  = 'CANCEL'
const SELECT  = 'SELECT'
const ACTION_CHANNEL = 'ACTION_CHANNEL'
const CANCELLED  = 'CANCELLED'

const effect = (type, payload) => ({[IO]: true, [type]: payload})

export function take(channel, pattern) {
  if(arguments.length >= 2) {
    check(channel, is.notUndef, 'take(channel, pattern): channel is undefined')
    check(channel, is.take, `take(channel, pattern): argument ${String(channel)} is not a valid channel (channel argument must have a take method)`)
    check(pattern, is.notUndef, 'take(channel, pattern): pattern is undefined')
    check(pattern, is.pattern, `take(channel, pattern): argument ${String(pattern)} is not a valid pattern (pattern must be String | Function: a => boolean | Array<String>)`)
  } else if(arguments.length === 1) {
    check(channel, is.notUndef, 'take(patternOrChannel): undefined argument')
    if(!is.take(channel)) {
      if(is.pattern(channel)) {
        pattern = channel
        channel = null
      } else {
        throw new Error(`take(patternOrChannel): argument ${String(channel)} is not valid channel or a valid pattern`)
      }
    } else {
      pattern = '*'
    }
  } else {
    pattern = '*'
  }

  return effect(TAKE, {channel, pattern})
}

export function takem(...args) {
  const eff = take(...args)
  eff[TAKE].maybe = true
  return eff
}

export function put(channel, action) {
  if(arguments.length > 1) {
    check(channel, is.notUndef, 'put(channel, action): argument channel is undefined')
    check(channel, is.put, `put(channel, action): argument ${channel} is not a valid channel (channel argument must have a put method)`)
    check(action, is.notUndef, 'put(channel, action): argument action is undefined')
  } else {
    check(channel, is.notUndef, 'put(action): argument action is undefined')
    action = channel
    channel = null
  }
  return effect(PUT, {channel, action})
}

put.sync = (...args) => {
  const eff = put(...args)
  eff[PUT].sync = true
  return eff
}

export function race(effects) {
  return effect(RACE, effects)
}

function getFnCallDesc(meth, fn, args) {
  check(fn, is.notUndef, `${meth}: argument fn is undefined`)

  let context = null
  if(is.array(fn)) {
    [context, fn] = fn
  } else if(fn.fn) {
    ({context, fn} = fn)
  }
  check(fn, is.func, `${meth}: argument ${fn} is not a function`)

  return {context, fn, args}
}

export function call(fn, ...args) {
  return effect(CALL, getFnCallDesc('call', fn, args))
}

export function apply(context, fn, args = []) {
  return effect(CALL, getFnCallDesc('apply', {context, fn}, args))
}

export function cps(fn, ...args) {
  return effect(CPS, getFnCallDesc('cps', fn, args))
}

export function fork(fn, ...args) {
  return effect(FORK, getFnCallDesc('fork', fn, args))
}

export function spawn(fn, ...args) {
  const eff = fork(fn, ...args)
  eff[FORK].detached = true
  return eff
}

const isForkedTask = task => task[TASK]

export function join(task) {
  check(task, is.notUndef, 'join(task): argument task is undefined')
  if(!isForkedTask(task)) {
    throw new Error(`join(task): argument ${task} is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)`)
  }

  return effect(JOIN, task)
}

export function cancel(task) {
  check(task, is.notUndef, 'cancel(task): argument task is undefined')
  if(!isForkedTask(task)) {
    throw new Error(`cancel(task): argument ${task} is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)`)
  }

  return effect(CANCEL, task)
}

export function select(selector, ...args) {
  if(arguments.length === 0) {
    selector = ident
  } else {
    check(selector, is.notUndef, 'select(selector,[...]): argument selector is undefined')
    check(selector, is.func, `select(selector,[...]): argument ${selector} is not a function`)
  }
  return effect(SELECT, {selector, args})
}

/**
  channel(pattern, [buffer])    => creates an event channel for store actions
**/
export function actionChannel(pattern, buffer) {
  check(pattern, is.notUndef, 'actionChannel(pattern,...): argument pattern is undefined')
  if(arguments.length > 1) {
    check(buffer, is.notUndef, 'actionChannel(pattern, buffer): argument buffer is undefined')
    check(buffer, is.notUndef, `actionChannel(pattern, buffer): argument ${buffer} is not a valid buffer`)
  }
  return effect(ACTION_CHANNEL, {pattern, buffer})
}

export function cancelled() {
  return effect(CANCELLED, {})
}

export const asEffect = {
  take    : effect => effect && effect[IO] && effect[TAKE],
  put     : effect => effect && effect[IO] && effect[PUT],
  race    : effect => effect && effect[IO] && effect[RACE],
  call    : effect => effect && effect[IO] && effect[CALL],
  cps     : effect => effect && effect[IO] && effect[CPS],
  fork    : effect => effect && effect[IO] && effect[FORK],
  join    : effect => effect && effect[IO] && effect[JOIN],
  cancel  : effect => effect && effect[IO] && effect[CANCEL],
  select  : effect => effect && effect[IO] && effect[SELECT],
  actionChannel : effect => effect && effect[IO] && effect[ACTION_CHANNEL],
  cancelled  : effect => effect && effect[IO] && effect[CANCELLED]
}
