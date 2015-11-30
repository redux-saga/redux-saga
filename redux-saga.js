const addType = effect => effect.type ?
      effect
   :  {...effect, type: `@@redux-saga/${Object.keys(obj)[0]}`}

export default function sagaMiddleware(saga) {
  return ({ getState, dispatch }) => next => action => {

    // hit the reducer
    const result = next(action)

    // hit the saga
    const generator = saga(getState, action)
    Promise.resolve(1).then( () => iterate(generator) )

    return result

    function iterate(generator) {

      step()

      function step(arg, isError) {

        const result = isError ? generator.throw(arg) : generator.next(arg)

        // retreives next action/effect
        if(!result.done) {
          const effect = result.value,
                response = typeof effect === 'function' ?
                    effect() // yielded thunk
                  : dispatch(addType(effect)) // yielded effect description

          Promise.resolve(response).then(step, err => step(err, true))
        }
      }
    }
  }
}
