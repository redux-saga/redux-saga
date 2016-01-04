import { noop, is, check, deferred, autoInc, asap, TASK } from './utils'
import { as, matcher } from './io'
import * as monitorActions from './monitorActions'

export const NOT_ITERATOR_ERROR = "proc first argument (Saga function result) must be an iterator"

const nextEffectId = autoInc()

export default function proc(
  iterator,
  subscribe = () => noop,
  dispatch = noop,
  monitor = noop,
  parentEffectId = 0,
  name = 'anonymous'
) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  let deferredInput
  const canThrow = is.throw(iterator)
  const deferredEnd = deferred()

  const unsubscribe = subscribe(input => {
    if(deferredInput && deferredInput.match(input))
      deferredInput.resolve(input)
  })

  iterator._isRunning = true
  next()

  return newTask(
    parentEffectId, name, iterator, deferredEnd.promise
  )

  function next(arg, isError) {
    deferredInput = null
    try {
      if(isError && !canThrow)
        throw arg
      const result = isError ? iterator.throw(arg) : iterator.next(arg)

      if(!result.done) {
        runEffect(result.value, parentEffectId).then(next, err => next(err, true))
      } else {
        end(result.value)
      }
    } catch(error) {
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
        is.array(effect)           ? Promise.all(effect.map(eff => runEffect(eff, effectId)))
      : is.iterator(effect)        ? proc(effect, subscribe, dispatch, monitor, effectId).done

      : (data = as.take(effect))   ? runTakeEffect(data)
      : (data = as.put(effect))    ? runPutEffect(data)
      : (data = as.race(effect))   ? runRaceEffect(data, effectId)
      : (data = as.call(effect))   ? runCallEffect(data.fn, data.args, effectId)
      : (data = as.cps(effect))    ? runCPSEffect(data.fn, data.args)
      : (data = as.fork(effect))   ? runForkEffect(data.task, data.args, effectId)
      : (data = as.join(effect))   ? runJoinEffect(data)

      : /* resolve anything else  */ Promise.resolve(effect)
    )
    promise.then(
      result => monitor( monitorActions.effectResolved(effectId, result) ),
      error  => monitor( monitorActions.effectRejected(effectId, error) )
    )

    return promise
  }

  function runTakeEffect(pattern) {
    deferredInput = deferred({ match : matcher(pattern), pattern })
    return deferredInput.promise
  }

  function runPutEffect(action) {
    return asap(() => dispatch(action) )
  }

  function runCallEffect(fn, args, effectId) {
    const result = fn(...args)
    return !is.iterator(result)
      ? Promise.resolve(result)
      : proc(result, subscribe, dispatch, monitor, effectId, fn.name).done
  }

  function runCPSEffect(fn, args) {
    return new Promise((resolve, reject) => {
      fn(...args.concat(
        (err, res) => is.undef(err) ? resolve(res) : reject(err)
      ))
    })
  }

  function runForkEffect(task, args, effectId) {
    let result, _iterator
    const isFunc = is.func(task)

    // we run the function, next we'll check if this is a generator function
    // (generator is a function that returns an iterator)
    if(isFunc)
      result = task(...args)

    // A generator function: i.e. returns an iterator
    if( is.iterator(result) ) {
      _iterator = result
    }
    // directly forking an iterator
    else if(is.iterator(task)) {
      _iterator = task
    }
    //simple effect: wrap in a generator
    else {
      _iterator = function*() {
        return ( yield isFunc ? result : task )
      }()
    }

    const name = isFunc ? task.name : 'anonymous'
    return Promise.resolve(
      proc(_iterator, subscribe, dispatch, monitor, effectId, name)
    )
  }

  function runJoinEffect(task) {
    return task.done
  }

  function runRaceEffect(effects, effectId) {
    return Promise.race(
      Object.keys(effects)
      .map(key =>
        runEffect(effects[key], effectId, key)
        .then( result => ({ [key]: result }),
               error  => Promise.reject({ [key]: error }))
      )
    )
  }

  function newTask(id, name, iterator, done) {
    return {
      [TASK]: true,
      id,
      name,
      done,
      isRunning: () => iterator._isRunning,
      getResult: () => iterator._result,
      getError: () => iterator._error
    }
  }
}
