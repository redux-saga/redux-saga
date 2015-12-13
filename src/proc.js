import { is } from './utils'
import { as, matcher } from './io'

export const NOT_ITERATOR_ERROR = "proc argument must be an iterator"

export default function proc(iterator, subscribe=()=>()=>{}, dispatch=()=>{}) {

  if(!is.iterator(iterator))
    throw new Error(NOT_ITERATOR_ERROR)

  let deferredInput, deferredEnd
  const canThrow = is.throw(iterator)

  const endP = new Promise((resolve, reject) => deferredEnd = {resolve, reject})

  const unsubscribe = subscribe(input => {
    if(deferredInput && deferredInput.match(input))
      deferredInput.resolve(input)
  })

  next()
  return endP

  function next(arg, isError) {
    deferredInput = null
    try {
      if(isError && !canThrow)
        throw arg
      const result = isError ? iterator.throw(arg) : iterator.next(arg)

      if(!result.done)
        runEffect(result.value).then(next, err => next(err, true))
      else {
        unsubscribe()
        deferredEnd.resolve(result.value)
      }
    } catch(err) {
      unsubscribe()
      deferredEnd.reject(err)
    }
  }

  function runEffect(effect) {
    let data
    return (
        is.promise(effect)         ? effect
      : is.array(effect)           ? Promise.all(effect.map(runEffect))
      : is.iterator(effect)        ? proc(effect, subscribe, dispatch)

      : (data = as.take(effect))   ? runTakeEffect(data)
      : (data = as.put(effect))    ? Promise.resolve(dispatch(data))
      : (data = as.race(effect))   ? runRaceEffect(data)
      : (data = as.call(effect))   ? data.fn(...data.args)
      : (data = as.cps(effect))    ? runCPSEffect(data)

      : /* resolve anything else  */ Promise.resolve(effect)
    )
  }

  function runTakeEffect(pattern) {
    return new Promise(resolve => {
      deferredInput = { resolve, match : matcher(pattern), pattern }
    })
  }

  function runCPSEffect(cps) {
    return new Promise((resolve, reject) => {
      cps.fn(...[
        ...cps.args,
        (err, res) => is.undef(err) ? resolve(res) : reject(err)
      ])
    })
  }

  function runRaceEffect(effects) {
    return Promise.race(
      Object.keys(effects)
      .map(key =>
        runEffect(effects[key])
        .then( result => ({ [key]: result }),
               error  => Promise.reject({ [key]: error }))
      )
    )
  }
}
