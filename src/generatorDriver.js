
import { NEXT_EVENT} from './constants'

export default function GeneratorDriver(generator, dispatch, addWaiting) {

  return () => {

    step()

    function step(arg, isError) {

      const {value: effect, done} = isError ? generator.throw(arg) : generator.next(arg)

      // retreives next action/effect
      if(!done) {
        const pattern = effect[NEXT_EVENT]
        if(pattern)
          addWaiting(step, pattern)
        else
          handleGeneratorEffect(generator, effect)
      }
    }

    function handleGeneratorEffect(generator, effect) {
      let response
      if(typeof effect === 'function') {
        response = effect()
      } else if(Array.isArray(effect) && typeof effect[0] === 'function') {
        response = effect[0](...effect.slice(1))
      } else {
        response = dispatch(effect)
      }

      Promise.resolve(response).then(step, err => step(err, true))
    }

  }

}
