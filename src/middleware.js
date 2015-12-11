
import proc from './processor'

export default (...sagas) => ({getState, dispatch}) => {

    const processors = sagas.map( saga => proc(saga, [getState], dispatch) )

    return next => action => {
      const result = next(action) // hit reducers
      processors.forEach(proc => proc(action))
      return result;
    }
}
