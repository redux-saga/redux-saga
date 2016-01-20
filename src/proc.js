import { noop, is, check, remove, deferred, autoInc, asap, TASK } from './utils'
import { as, matcher } from './io'
import * as monitorActions from './monitorActions'


export const NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator'
export const PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL'
export const RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL'
export const MANUAL_CANCEL = 'MANUAL_CANCEL'

const nextEffectId = autoInc()

export const CANCEL = Symbol('@@redux-saga/cancelPromise')

export class SagaCancellationException {
  constructor(type, saga, origin) {
    this.type = type
    this.saga = saga
    this.origin = origin
  }
}

export default function proc(
  iterator,
  subscribe = () => noop,
  dispatch = noop,
  monitor = noop,
  parentEffectId = 0,
  name = 'anonymous'
) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  const deferredInputs = []
  const canThrow = is.throw(iterator)
  const deferredEnd = deferred()

  const unsubscribe = subscribe(input => {
   deferredInputs.forEach( def => {
     if(def.match(input))
       def.resolve(input)
   })
 })

  iterator._isRunning = true
  next()

  return newTask(
    parentEffectId, name, iterator, deferredEnd.promise
  )

  function next(arg, isError) {
    if(!iterator._isRunning)
      return
    try {
      if(isError && !canThrow)
        throw arg
      const result = isError ? iterator.throw(arg) : iterator.next(arg)
      if(!result.done) {
        const currentEffect = runEffect(result.value, parentEffectId)
        deferredEnd.promise[CANCEL] = currentEffect[CANCEL]
        currentEffect.then(next, err => next(err, true))
      } else {
        end(result.value)
      }
    } catch(error) {
      /*eslint-disable no-console*/
      console.warn(`${name}: uncaught`, error )
      end(error, true)
    }
  }

  function end(result, isError) {
    iterator._isRunning = false
    if(!isError) {
      iterator._result = result
      deferredEnd.resolve(result)
    } else {
      iterator._error = result
      deferredEnd.reject(result)
    }
    unsubscribe()
  }

  function runEffect(effect, parentEffectId, label = '') {
    const effectId = nextEffectId()
    monitor( monitorActions.effectTriggered(effectId, parentEffectId, label, effect) )

    let data
    const promise = (
        is.array(effect)           ? runParallelEffect(effect, effectId)
      : is.iterator(effect)        ? proc(effect, subscribe, dispatch, monitor, effectId).done

      : (data = as.take(effect))   ? runTakeEffect(data)
      : (data = as.put(effect))    ? runPutEffect(data)
      : (data = as.race(effect))   ? runRaceEffect(data, effectId)
      : (data = as.call(effect))   ? runCallEffect(data, effectId)
      : (data = as.cps(effect))    ? runCPSEffect(data)
      : (data = as.fork(effect))   ? runForkEffect(data, effectId)
      : (data = as.join(effect))   ? runJoinEffect(data)
      : (data = as.cancel(effect)) ? runCancelEffect(data)

      : /* resolve anything else  */ Promise.resolve(effect)
    )

    const def = deferred()
    let isRunning = true
    const completeWith = fn => outcome => {
      if(isRunning) {
        isRunning = false
        fn(outcome)
      }
    }
    promise.then(completeWith(def.resolve), completeWith(def.reject))
    def.promise[CANCEL] = ({type, origin}) => {
      if(isRunning) {
        isRunning = false
        const error = new SagaCancellationException(type, name, origin)
        cancelPromise(promise, error)
        def.reject(error)
      }

    }

    def.promise.then(
      result => monitor( monitorActions.effectResolved(effectId, result) ),
      error  => monitor( monitorActions.effectRejected(effectId, error) )
    )
    return def.promise
  }

  function runTakeEffect(pattern) {
    const def = deferred({ match : matcher(pattern), pattern })
    deferredInputs.push(def)
    const done = () => remove(deferredInputs, def)
    def.promise.then(done, done)
    def.promise[CANCEL] = done
    return def.promise
  }

  function runPutEffect(action) {
    return asap(() => dispatch(action) )
  }

  function runCallEffect({context, fn, args}, effectId) {
    const result = fn.apply(context, args)
    return !is.iterator(result)
      ? Promise.resolve(result)
      : proc(result, subscribe, dispatch, monitor, effectId, fn.name).done
  }

  function runCPSEffect({context, fn, args}) {
    return new Promise((resolve, reject) => {
      fn.apply(context, args.concat(
        (err, res) => is.undef(err) ? resolve(res) : reject(err)
      ))
    })
  }

  function runForkEffect({context, fn, args}, effectId) {
    let result, _iterator

    // we run the function, next we'll check if this is a generator function
    // (generator is a function that returns an iterator)
    result = fn.apply(context, args)

    // A generator function: i.e. returns an iterator
    if( is.iterator(result) ) {
      _iterator = result
    }

    //simple effect: wrap in a generator
    else {
      _iterator = function*() {
        return (yield result)
      }()
    }

    return Promise.resolve(
      proc(_iterator, subscribe, dispatch, monitor, effectId, fn.name, true)
    )
  }

  function runJoinEffect(task) {
    return task.done
  }

  function runCancelEffect(task) {
    task.done[CANCEL](
      new SagaCancellationException(MANUAL_CANCEL, '', name)
    )
    return Promise.resolve()
  }

  function runParallelEffect(effects, effectId) {
    const promises = effects.map(eff => runEffect(eff, effectId))
    const ret = Promise.all(promises)
    ret[CANCEL] = error => {
      promises.forEach(p => cancelPromise(p, error))
    }

    ret.catch(() => {
      ret[CANCEL](
        new SagaCancellationException(PARALLEL_AUTO_CANCEL, name, name)
      )
    })
    return ret
  }

  function runRaceEffect(effects, effectId) {
    const promises = []
    const retP = Promise.race(
      Object.keys(effects)
        .map(key => {
          const promise = runEffect(effects[key], effectId, key)
          promises.push(promise)
          return promise.then(
            result => ({[key]: result}),
            error => Promise.reject({[key]: error})
          )
        })
    )

    retP[CANCEL] = error => {
      promises.forEach(p => cancelPromise(p, error))
    }

    const done = () => retP[CANCEL](
      new SagaCancellationException(RACE_AUTO_CANCEL, name, name)
    )
    retP.then(done, done)
    return retP
  }

  function newTask(id, name, iterator, done, forked) {
    return {
      [TASK]: true,
      id,
      name,
      done,
      forked,
      isRunning: () => iterator._isRunning,
      getResult: () => iterator._result,
      getError: () => iterator._error
    }
  }

  function cancelPromise(promise, error) {
    if(promise[CANCEL])
      promise[CANCEL](error)
  }
}
