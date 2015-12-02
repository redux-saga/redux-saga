
export const SAGA_ARGUMENT_ERROR = "Saga must be a Generator function";

function isGenerator(fn) {
  return fn.constructor.name === 'GeneratorFunction';
}

export default function sagaMiddleware(saga) {
  if(!isGenerator(saga))
    throw new Error(SAGA_ARGUMENT_ERROR);

  return ({getState, dispatch}) => next => action => {

    // hit the reducer
    const result = next(action);

    // hit the saga
    const generator = saga(getState, action);
    iterate(generator);

    return result;

    function iterate(generator) {

      step()

      function step(arg, isError) {

        const {value: effect, done} = isError ? generator.throw(arg) : generator.next(arg)

        // retreives next action/effect
        if(!done) {
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
  };
}
