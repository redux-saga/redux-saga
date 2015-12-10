
import { SAGA_ARGUMENT_ERROR, UNDEFINED_YIELD_ERROR, NEXT_ACTION, RACE, ALL } from './constants'
import { kTrue, isUndef, isGenerator, someTrue } from './utils'
import actionQueue from './actionQueue'

export function nextAction(...patterns) {
  return { [NEXT_ACTION] :
      patterns.length === 0 ? '*'
    : patterns.length > 1   ? patterns
    : patterns[0]
  }
}

// effects : { [key]: effect, ... }
export function race(effects) {
  return { [RACE] : effects }
}

// effects : [effect]
export function all(effects) {
  return { [ALL] : effects }
}


export default function sagaMiddleware(...sagas) {
  for (var i = 0; i < sagas.length; i++) {
    if(!isGenerator(sagas[i]))
      throw new Error(SAGA_ARGUMENT_ERROR);
  }

  return ({getState, dispatch}) => next => {

    const actionQQ = actionQueue()

    sagas.map( saga => saga(getState) )
         .forEach( generator => step(generator)() )

    return action => {
      const result = next(action) // hit reducers
      actionQQ.dispatch(action)
      return result;
    }

    function step(generator) {
      return next

      function next(arg, isError) {
        // remove all actions queried by this generator as it's no longer waiting
        // for them; this may happen when using the race combinator with events competing
        // with other futures (timeouts, servers responses ...)
        if(arg && arg[RACE])
          actionQQ.remove(q => q.generator === generator)
        const result = isError ? generator.throw(arg) : generator.next(arg)
        if(!result.done)
          runEffect(generator, result.value).then(next, err => next(err, true))
      }
    }

    function matcher(pattern) {
      return () =>
         pattern === '*'               ? kTrue
       : pattern instanceof RegExp     ? action => pattern.test(action.type)
       : Array.isArray(pattern)        ? action => pattern.some( p => action.type === p )
       : typeof pattern === 'function' ? pattern
       : action => action.type === pattern
    }

    function runEffect(generator, effect) {
      if(isUndef(effect))
        throw new Error(UNDEFINED_YIELD_ERROR)

      return (
          effect[NEXT_ACTION] ?
            actionQQ.query({ generator, match: matcher(effect[NEXT_ACTION])(), pattern: effect[NEXT_ACTION] })
        : effect[RACE] ?
            runRaceEffect(generator, effect[RACE])
        : effect[ALL] ?
            runAllEffect(generator, effect[ALL])
        : Array.isArray(effect) && typeof effect[0] === 'function' ?
            effect[0](...effect.slice(1))
        : typeof effect === 'function' ?
            effect()
        : /* treat anything else as a dispatch item */
            Promise.resolve(dispatch(effect))
      )
    }

    function runRaceEffect(generator, effects) {
      return Promise.race(
        Object.keys(effects)
        .map(key =>
          runEffect(generator, effects[key])
          .then( result => ({[key]: result, [RACE]: key}),
                 error => Promise.reject({[key]: error, [RACE]: key})))
      )
    }

    function runAllEffect(generator, effects) {
      return Promise.all(
        Object.keys(effects).map( key => runEffect(generator, effects[key]) )
      )
    }

  }
}
