

export default function sagaMiddleware(saga) {
  return ({ getState, dispatch }) => next => action => {
    
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
          Promise.resolve( dispatch(result.value) ).then( step )
        }
      }
    }

}



}
