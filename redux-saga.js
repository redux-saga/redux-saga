
function isPromise(arg) {
  return arg && typeof arg.then === 'function'
}

export default function sagaMiddleware(saga) {
  return ({ getState, dispatch }) => next => action => {

    // let effects pass
    if( isPromise(action) )
      return action

    // hit the reducer
    const result = next(action)

    // hit the saga
    const generatorFn = saga(getState(), action)
    if(typeof generatorFn === 'function') {
      const generator = generatorFn(getState, action)
      Promise.resolve(1).then( () => iterate(generator) )
    }

    return result

    function iterate(generator) {

      step()

      function step(arg) {

        const result = generator.next(arg)

        // retreives next action/effect
        if(!result.done) {
          // dispatch action/effect
          const nextResult = dispatch(result.value)

          if(isPromise(nextResult))
            nextResult.then(step)
          else
            step(nextResult)
        } else {
          return result.value
        }
      }
    }

}



}
