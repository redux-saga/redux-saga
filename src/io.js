import { is, kTrue } from './utils'

const IO    = Symbol('IO')
const TAKE  = 'TAKE'
const PUT   = 'PUT'
const RACE  = 'RACE'
const CALL  = 'CALL'
const CPS   = 'CPS'

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

export default {
  take  : pattern => effect(TAKE, is.undef(pattern) ? '*' : pattern),
  put   : ac => effect(PUT, ac),
  race  : effects => effect(RACE, effects),
  call  : (fn, ...args) => effect(CALL, { fn, args }),
  cps   : (fn, ...args) => effect(CPS,{ fn, args })
}

export const as = {
  take  : effect => effect && effect[IO] && effect[TAKE],
  put   : effect => effect && effect[IO] && effect[PUT],
  race  : effect => effect && effect[IO] && effect[RACE],
  call  : effect => effect && effect[IO] && effect[CALL],
  cps   : effect => effect && effect[IO] && effect[CPS]
}
