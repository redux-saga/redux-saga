import { is, as, io, matchers } from './utils'

export const ARG_NOT_A_GENERATOR_ERROR = "processor input must be a Generator function"
export const UNDEFINED_YIELD_ERROR = "Generator must not yield null or undefined values"

export default function processor(genFn, args, dispatch) {

  if( !is.generator(genFn) )
    throw new Error(ARG_NOT_A_GENERATOR_ERROR)

  const generator = genFn(io, ...args)
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
        (data = as.wait(effect))   ? runDeferredEffect(data)
      : (data = as.call(effect))   ? data.fn(...data.args)
      : (data = as.race(effect))   ? runRaceEffect(data)
      : (data = as.action(effect)) ? Promise.resolve(dispatch(data))
      : is.array(effect)          ? Promise.all(effect.map(runEffect))
      : is.func(effect)           ? runThunkEffect(effect)
      : /* resolve anything else */ Promise.resolve(effect)
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
