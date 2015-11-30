const addType = obj => `@@redux-saga/${Object.keys(obj)[0]}`

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

      function step(arg) {

        const result = generator.next(arg)

        // retreives next action/effect
        if(!result.done) {
          const effect = result.value.type ? result.value : {...result.value, type: addType(result.value) }
          // dispatch action/effect
          Promise.resolve( dispatch(effect) ).then( step )
        }
      }
    }
  }
}
