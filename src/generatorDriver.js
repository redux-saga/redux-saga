
import { NEXT_EVENT, RACE} from './constants'

export default function GeneratorDriver(generator, dispatch, addWaiting) {

  return () => {

    step()

    function step(arg, isError) {

      const {value: effect, done} = isError ? generator.throw(arg) : generator.next(arg)

      // retreives next action/effect
      if(!done) {
        let promise
        if( effect[NEXT_EVENT] )
          promise = new Promise(resolve => addWaiting(resolve, effect[NEXT_EVENT]))
        else if( effect[RACE] ) {
          const {event, effect: effect2} = effect[RACE]
          const eventP = (new Promise(resolve => addWaiting(resolve, event[NEXT_EVENT]))).then(event => ({event}))
          const effectP = Promise.resolve(runEffect(effect2)).then(effect => ({effect}))
          promise = Promise.race([eventP, effectP])
        } else {
          promise = Promise.resolve( runEffect(effect) )
        }
        promise.then(step, err => step(err, true))
      }
    }

    function runEffect(effect) {
      if(typeof effect === 'function') {
        return effect()
      } else if(Array.isArray(effect) && typeof effect[0] === 'function') {
        return effect[0](...effect.slice(1))
      } else {
        return dispatch(effect)
      }
    }

  }
}
