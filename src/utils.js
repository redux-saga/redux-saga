const IO      = Symbol('IO')
const CALL    = 'CALL'
const WAIT    = 'WAIT'
const RACE    = 'RACE'
const ACTION  = 'ACTION'

const kTrue = () => true

export const is = {
  undef     : v => v === null || v === undefined,
  func      : f => typeof f === 'function',
  array     : Array.isArray,
  promise   : p => p && typeof p.then === 'function',
  generator : g => g.constructor.name === 'GeneratorFunction'
}

export const matchers = {
  wildcard  : () => kTrue,
  default   : pattern => input => input.type === pattern,
  array     : patterns => input => patterns.some( p => p === input.type ),
  predicate : predicate => input => predicate(input)
}

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

export const io = {
  call    : (fn, ...args) => effect(CALL, { fn, args }),
  wait    : pattern => effect(WAIT, is.undef(pattern) ? '*' : pattern),
  race    : effects => effect(RACE, effects),
  action  : ac => effect(ACTION, ac)
}

export const as = {
  call    : effect => effect && effect[IO] && effect[CALL],
  wait    : effect => effect && effect[IO] && effect[WAIT],
  race    : effect => effect && effect[IO] && effect[RACE],
  action  : effect => effect && effect[IO] && effect[ACTION]
}
