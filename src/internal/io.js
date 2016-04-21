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
const CHANNEL = 'CHANNEL'
const STATUS  = 'STATUS'

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

export function take(channel, pattern) {
  if(arguments.length >= 2) {
    check(channel, is.notUndef, 'take(channel, pattern): channel is undefined')
    check(channel, is.take, 'take(channel, pattern): invalid channel (channel argument must have a `take` method)')
    check(pattern, is.notUndef, 'take(channel, pattern): pattern is undefined')
    check(pattern, is.pattern, 'take(channel, pattern): invalid pattern (pattern must be String | Function: a => boolean | Array<String>)')
  } else if(arguments.length === 1) {
    check(channel, is.notUndef, 'take(patternOrChannel): undefined argument')
    if(!is.take(channel)) {
      if(is.pattern(channel)) {
        pattern = channel
        channel = null
      } else throw new Error('take(patternOrChannel): argument must be either a channel or a valid pattern')
    }
  } else pattern = '*'

  return effect(TAKE, {channel, pattern})
}

export function takem(...args) {
  const eff = take(...args)
  eff[TAKE].maybe = true
  return eff
}

export function put(channel, action) {
  if(arguments.length > 1) {
    check(channel, is.notUndef, 'put(channel, action): channel is undefined')
    check(channel, is.put, 'put(channel, action): invalid channel (channel argument must have a `put` method)')
    check(action, is.notUndef, 'put(channel, action): action is undefined')
  } else {
    check(channel, is.notUndef, 'put(action): action is undefined')
    action = channel
    channel = null
  }
  return effect(PUT, {channel, action})
}

export function race(effects) {
  return effect(RACE, effects)
}

function getFnCallDesc(meth,fn, args) {
  check(fn, is.notUndef, `${meth}: fn argument is undefined`)

  let context = null
  if(is.array(fn)) {
    [context, fn] = fn
  } else if(fn.fn) {
    ({context, fn} = fn)
  }
  check(fn, is.func, `${meth}: fn argument is not a function`)

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
  check(task, is.notUndef, 'join(task): task is undefined')
  if(!isForkedTask(task))
    throw new Error('join(task): task is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)')

  return effect(JOIN, task)
}

export function cancel(task) {
  check(task, is.notUndef, 'cancel(task): task is undefined')
  if(!isForkedTask(task))
    throw new Error('cancel(task): task is not a valid Task object \n(HINT: if you are getting this errors in tests, consider using createMockTask from redux-saga/utils)')

  return effect(CANCEL, task)
}

export function select(selector, ...args) {
  if(arguments.length === 0) {
    selector = ident
  } else {
    check(select, is.notUndef, 'select(selector,[...]): selector is undefined')
    check(selector, is.func, 'select(selector,[...]): selector is not a function')
  }
  return effect(SELECT, {selector, args})
}

/**
  channel()           => creates a buffered channel
  channel(buffer)     => creates a buffered channel using the specified buffer
  channel(pattern, [buffer])    => creates an event channel for store actions
  channel(observable, [buffer]) => creates an event channel for the given observable
**/
export function channel(src, buffer) {

  const parseArgs = (meth, checkBuffer) => {
    check(src, is.notUndef, `${meth}: argument is undefined`)
    if(checkBuffer && is.buffer(src))
      buffer = src
    else if(is.pattern(src))
      pattern = src
    else if(is.observable(src))
      observable = src
    else
      throw new Error(`${meth}: argument must be an Obervable or a valid pattern${checkBuffer ? ' | a valid buffer' : ''}`)
  }

  let pattern, observable
  if(arguments.length === 1)
    parseArgs('channel(srcOrBuffer)', true)
  else if(arguments.length > 1) {
    parseArgs('channel(src, buffer)', false)
    check(buffer, is.notUndef, 'channel(src, buffer): buffer is undefined')
    check(buffer, is.notUndef, 'channel(src, buffer): invalid buffer')
  }

  return effect(CHANNEL, {observable, pattern, buffer})
}

export function status() {
  return effect(STATUS, {})
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
  channel : effect => effect && effect[IO] && effect[CHANNEL],
  status  : effect => effect && effect[IO] && effect[STATUS]
}
