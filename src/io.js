import { is, kTrue, check, TASK } from './utils'


export const CALL_FUNCTION_ARG_ERROR = "call/cps/fork first argument must be a function, an array [context, function] or an object {context, fn}"
export const FORK_ARG_ERROR = "fork first argument must be a generator function or an iterator"
export const JOIN_ARG_ERROR = "join argument must be a valid task (a result of a fork)"
export const CANCEL_ARG_ERROR = "cancel argument must be a valid task (a result of a fork)"
export const INVALID_PATTERN = "Invalid pattern passed to `take` (HINT: check if you didn't mispell a constant)"


const IO    = Symbol('IO')
const TAKE    = 'TAKE'
const PUT     = 'PUT'
const RACE    = 'RACE'
const CALL    = 'CALL'
const CPS     = 'CPS'
const FORK    = 'FORK'
const JOIN    = 'JOIN'
const CANCEL  = 'CANCEL'

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

const matchers = {
  wildcard  : () => kTrue,
  default   : pattern => input => input.type === pattern,
  array     : patterns => input => patterns.some( p => p === input.type ),
  predicate : predicate => input => predicate(input)
}

export function matcher(pattern) {
  return (
      pattern === '*'   ? matchers.wildcard
    : is.array(pattern) ? matchers.array
    : is.func(pattern)  ? matchers.predicate
    : matchers.default
  )(pattern)
}

export function take(pattern){
  if (arguments.length > 0 && is.undef(pattern)) {
    throw new Error(INVALID_PATTERN)
  }

  return effect(TAKE, is.undef(pattern) ? '*' : pattern)
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

export const as = {
  take    : effect => effect && effect[IO] && effect[TAKE],
  put     : effect => effect && effect[IO] && effect[PUT],
  race    : effect => effect && effect[IO] && effect[RACE],
  call    : effect => effect && effect[IO] && effect[CALL],
  cps     : effect => effect && effect[IO] && effect[CPS],
  fork    : effect => effect && effect[IO] && effect[FORK],
  join    : effect => effect && effect[IO] && effect[JOIN],
  cancel  : effect => effect && effect[IO] && effect[CANCEL]
}
