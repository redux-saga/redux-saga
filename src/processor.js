
export const ARG_NOT_A_GENERATOR_ERROR = "processor input must be a Generator function"
export const UNDEFINED_YIELD_ERROR = "Generator must not yield null or undefined values"

const CALL = Symbol('CALL')
const INPUT = Symbol('INPUT')
const RACE = Symbol("RACE")

const kTrue = () => true
const is = {
  undef     : v => v === null || v === undefined,
  func      : f => typeof f === 'function',
  array     : Array.isArray,
  promise   : p => p && typeof p.then === 'function',
  generator : g => g.constructor.name === 'GeneratorFunction'
}

const matchers = {
  wildcard  : () => kTrue,
  default   : pattern => input => input.type === pattern,
  array     : patterns => input => patterns.some( p => p === input.type ),
  predicate : predicate => input => predicate(input)
}

const call  = (fn, ...args) => ({ [CALL] : { fn, args } })
const input = query => ({ [INPUT] : is.undef(query) ? '*' : query })
const race  = effects => ({ [RACE] : effects })

export const asCall = effect => effect && effect[CALL]
export const asInput = effect => effect && effect[INPUT]
export const asRace = effect => effect && effect[RACE]


export default function processor(genFn, args, output) {

  if( !is.generator(genFn) )
    throw new Error(ARG_NOT_A_GENERATOR_ERROR)

  const generator = genFn({input, call, race}, ...args)
  let deferred

  next()

  return e => {
    if(deferred && deferred.match(e))
      deferred.resolve(e)
  }

  function next(arg, isError) {
    deferred = null
    const result = isError ? generator.throw(arg) : generator.next(arg)
    if(!result.done)
      runEffect(result.value).then(next, err => next(err, true))
  }

  function runEffect(effect) {
    if( is.undef(effect) )
      throw new Error(UNDEFINED_YIELD_ERROR)

    let data
    return (
      is.promise(effect)          ? effect
      : (data = asInput(effect))  ? runDeferredEffect(data)
      : (data = asCall(effect))   ? data.fn(...data.args)
      : (data = asRace(effect))   ? runRaceEffect(data)
      : is.array(effect)          ? Promise.all(effect.map(runEffect))
      : is.func(effect)           ? runThunkEffect(effect)
      : /* otherwise output      */ Promise.resolve( output(effect) )
    )
  }

  function runDeferredEffect(pattern) {
    return new Promise(resolve => {
      deferred = { resolve, match : matcher(pattern), pattern }
    })
  }

  function runThunkEffect(thunk) {
    return thunk.length < 1 ?
        Promise.resolve(thunk())
      : new Promise((resolve, reject) => {
          thunk( (err, res) => is.undef(err) ? resolve(res) : reject(err) )
        })
  }

  function runRaceEffect(effects) {
    return Promise.race(
      Object.keys(effects)
      .map(key =>
        runEffect(effects[key])
        .then( result => ({ [key]: result }),
               error  => Promise.reject({ [key]: error }))
      )
    )
  }

  function matcher(pattern) {
    return (
        pattern === '*'   ? matchers.wildcard
      : is.array(pattern) ? matchers.array
      : is.func(pattern)  ? matchers.predicate
      : matchers.default
    )(pattern)
  }

}
