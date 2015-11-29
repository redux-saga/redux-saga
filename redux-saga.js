

export default function sagaMiddleware(saga, services) {
  return ({ getState, dispatch }) => next => action => {

    const state = getState()

    const ret = next(action)

    const effects = saga(state, action)
    effects.forEach( eff => {
      const sce = services[eff.type];
      if(sce)
        sce(eff, dispatch)
    })
    return ret
  }
}
