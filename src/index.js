
import { SAGA_ARGUMENT_ERROR, NEXT_EVENT, RACE } from './constants'
import { isGenerator, span } from './utils'
import generatorDriver from './generatorDriver'

export function nextEvent(...patterns) {
  return { [NEXT_EVENT] :
      patterns.length === 0 ? '*'
    : patterns.length > 1   ? patterns
    : patterns[0]
  }
}

export function race(event, effect) {
  return {
    [RACE] : { event, effect }
  }
}


export default function sagaMiddleware(sagas) {

  for (var i = 0; i < sagas.length; i++) {
    if(!isGenerator(sagas[i]))
      throw new Error(SAGA_ARGUMENT_ERROR);
  }

  return ({getState, dispatch}) => next => {

    // waitings : [{pattern, step}]
    let waitings = []

    const genDrivers = sagas.map( saga => generatorDriver(saga(getState), dispatch, addWaiting) )
    genDrivers.forEach(run => run())

    return action => {

      // hit the reducer
      const result = next(action)

      // hit the sagas
      dispatchActionToWaitings(action)

      return result;
    }

    function addWaiting(step, pattern) {
      waitings.push({step, pattern})
    }

    function dispatchActionToWaitings(action) {
      const [matching, notMatching] = span(waitings, ({pattern}) => matches(action, pattern))
      waitings = notMatching
      matching.forEach( ({step}) => step(action) )
    }

    function matches(action, pattern) {
      return  pattern === '*'               ? true
            : pattern instanceof RegExp     ? pattern.test(action.type)
            : Array.isArray(pattern)        ? pattern.some(p => matches(action, p))
            : typeof pattern === 'function' ? pattern(action)
            : action.type === pattern
    }

  }
}
