import { sym, is, ident, check, TASK } from './utils'


export const CALL_FUNCTION_ARG_ERROR = "call/cps/fork first argument must be a function, an array [context, function] or an object {context, fn}"
export const FORK_ARG_ERROR   = "fork first argument must be a generator function or an iterator"
export const JOIN_ARG_ERROR   = "join argument must be a valid task (a result of a fork)"
export const CANCEL_ARG_ERROR = "cancel argument must be a valid task (a result of a fork)"
export const UNDEFINED_CHANNEL  = "Undefined channel passed to `take`"
export const INAVLID_CHANNEL = "Invalid channel passed to take (a channel must have a `take` method)"
export const UNDEFINED_PATTERN_OR_CHANNEL  = "Undefined pattern/channel passed to `take` (HINT: check if you didn't mispell a constant or a property)"
export const SELECT_ARG_ERROR = "select first argument must be a function"


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

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

export function take(channel, pattern) {
  if(arguments.length >= 2) {
    if(is.undef(channel))
      throw new Error(UNDEFINED_CHANNEL)
    else if(!is.channel(channel))
      throw new Error(INAVLID_CHANNEL)
  } else if(arguments.length === 1) {
    check(channel, is.notUndef, UNDEFINED_PATTERN_OR_CHANNEL)
    if(!is.channel(channel)) {
      pattern = channel
      channel = null
    }
  } else {
    pattern = '*'
  }

  return effect(TAKE, {channel, pattern})
}

export function put(action) {
  return effect(PUT, action)
}

export function race(effects) {
  return effect(RACE, effects)
}

function getFnCallDesc(fn, args) {
  check(fn, is.notUndef, CALL_FUNCTION_ARG_ERROR)

  let context = null
  if(is.array(fn)) {
    [context, fn] = fn
  } else if(fn.fn) {
    ({context, fn} = fn)
  }
  check(fn, is.func, CALL_FUNCTION_ARG_ERROR)

  return {context, fn, args}
}

export function call(fn, ...args) {
  return effect(CALL, getFnCallDesc(fn, args))
}

export function apply(context, fn, args = []) {
  return effect(CALL, getFnCallDesc({context, fn}, args))
}

export function cps(fn, ...args) {
  return effect(CPS, getFnCallDesc(fn, args))
}

export function fork(fn, ...args) {
  return effect(FORK, getFnCallDesc(fn, args))
}

export function spawn(fn, ...args) {
  const eff = fork(fn, ...args)
  eff[FORK].detached = true
  return eff
}

const isForkedTask = task => task[TASK]

export function join(taskDesc) {
  if(!isForkedTask(taskDesc))
    throw new Error(JOIN_ARG_ERROR)

  return effect(JOIN, taskDesc)
}

export function cancel(taskDesc) {
  if(!isForkedTask(taskDesc))
    throw new Error(CANCEL_ARG_ERROR)

  return effect(CANCEL, taskDesc)
}

export function select(selector, ...args) {
  if(arguments.length === 0) {
    selector = ident
  } else {
    check(selector, is.func, SELECT_ARG_ERROR)
  }
  return effect(SELECT, {selector, args})
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
  select  : effect => effect && effect[IO] && effect[SELECT]
}
