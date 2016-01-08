import { is, check, TASK } from './utils'
import { as, matcher } from './io'

export const NOT_ITERATOR_ERROR = "proc first argument must be an iterator"

export class SagaCancellationException {
  constructor(message, stack=[]) {
    this.message = message
    this.stack = stack
  }
}

export const CANCEL = Symbol('cancel')

export default function proc(iterator, subscribe=()=>()=>{}, dispatch=()=>{}) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  let deferredInputs = [], deferredEnd
  const canThrow = is.throw(iterator)

  const endP = new Promise((resolve, reject) => deferredEnd = {resolve, reject})

  const unsubscribe = subscribe(input => {
    for (let deferredInput of deferredInputs) {
      if(deferredInput.match(input))
        deferredInput.resolve(input)
    }
  })

  iterator._isRunning = true
  next()

  return endP

  function next(arg, isError) {
    //console.log('next', arg, isError)
    try {
      if(isError && !canThrow)
        throw arg
      const result = isError ? iterator.throw(arg) : iterator.next(arg)

      if(!result.done) {
        //console.log('yield', name, result.value)
        const currentEffect = runEffect(result.value)
        endP[CANCEL] = currentEffect[CANCEL]
        currentEffect.then(next, err => next(err, true))
      } else {
        //console.log('return', name, result.value)
        iterator._isRunning = false
        iterator._result = result.value
        unsubscribe()
        deferredEnd.resolve(result.value)
      }
    } catch(err) {
      //console.log('catch', name, err)
      iterator._isRunning = false
      iterator._error = err
      unsubscribe()
      deferredEnd.reject(err)

      if (err instanceof SagaCancellationException) {
        throw err
      }
    }
  }

  function runEffect(effect) {
    let deferred, isRunning = true
    const ret = new Promise((resolve, reject) => {
      deferred = {resolve, reject}
    })

    let data
    const effectPromise = (
        is.array(effect)           ? runParallelEffect(effect)
      : is.iterator(effect)        ? proc(effect, subscribe, dispatch)

      : (data = as.take(effect))   ? runTakeEffect(data)
      : (data = as.put(effect))    ? runPutEffect(data)
      : (data = as.race(effect))   ? runRaceEffect(data)
      : (data = as.call(effect))   ? runCallEffect(data.fn, data.args)
      : (data = as.cps(effect))    ? runCPSEffect(data.fn, data.args)
      : (data = as.fork(effect))   ? runForkEffect(data.task, data.args)
      : (data = as.join(effect))   ? runJoinEffect(data)
      : (data = as.cancel(effect)) ? runCancelEffect(data)

      : /* resolve anything else  */ Promise.resolve(effect)
    )

    effectPromise.then(
      res => isRunning && deferred.resolve(res),
      err => isRunning && deferred.reject(err)
    )

    ret[CANCEL] = (err) => {
      if (!isRunning)
        return

      isRunning = false

      const error = new SagaCancellationException(err.message,
        [effect, ...err.stack])

      if (effectPromise[CANCEL])
        effectPromise[CANCEL](error)

      deferred.reject(error)
    }

    return ret
  }

  function runTakeEffect(pattern) {
    let deferredInput;
    const ret = new Promise(resolve => {
      deferredInput = { resolve, match : matcher(pattern), pattern }
      deferredInputs.push(deferredInput)
    });

    const done = () => {
      const ind = deferredInputs.indexOf(deferredInput)
      if (ind !== -1)
        deferredInputs.splice(ind, 1)
    }

    ret.then(done, done)

    ret[CANCEL] = done

    return ret
  }

  function runPutEffect(action) {
    return Promise.resolve(1).then(() => dispatch(action) )
  }

  function runCallEffect(fn, args) {
    return !is.generator(fn)
      ? Promise.resolve( fn(...args) )
      : proc(fn(...args), subscribe, dispatch)
  }

  function runCPSEffect(fn, args) {
    return new Promise((resolve, reject) => {
      fn(...args.concat(
        (err, res) => is.undef(err) ? resolve(res) : reject(err)
      ))
    })
  }

  function runForkEffect(task, args) {
    let _generator, _iterator
    if(is.generator(task)) {
      _generator = task
      _iterator = _generator(...args)
    } else if(is.iterator(task)) {
      // directly forking an iterator
      _iterator = task
    } else {
      //simple effect: wrap in a generator
      _iterator = function*() {
        return ( yield is.func(task) ? task(...args) : task )
      }()
    }

    const _done = proc(_iterator, subscribe, dispatch)

    const taskDesc = {
      [TASK]: true,
      _generator,
      _iterator,
      _done,
      name : _generator && _generator.name,
      isRunning: () => _iterator._isRunning,
      result: () => _iterator._result,
      error: () => _iterator._error
    }
    return Promise.resolve(taskDesc)
  }

  function runJoinEffect(task) {
    return task._done
  }

  function runCancelEffect(task) {
    task._done[CANCEL](new SagaCancellationException(
      'cancelled by cancel effect'
    ))
    return Promise.resolve()
  }

  function runParallelEffect(effects) {
    const promises = effects.map(runEffect)
    const ret = Promise.all(promises)

    ret[CANCEL] = (err) => {
      for (let promise of promises)
        if (promise[CANCEL])
          promise[CANCEL](err)
    }

    ret.catch(() => {
      ret[CANCEL](new SagaCancellationException(
        'cancelled automatically by parallel effect rejection'
      ))
    })

    return ret
  }

  function runRaceEffect(effects) {
    const promises = []

    const ret = Promise.race(
      Object.keys(effects)
        .map(key => {
          const promise = runEffect(effects[key])
          promises.push(promise)
          return promise.then(result => ({[key]: result}),
                              error => Promise.reject({[key]: error}))

        })
    )

    ret[CANCEL] = err => {
      for (let promise of promises)
        if (promise[CANCEL])
          promise[CANCEL](err)
    }

    const done = () => {
      ret[CANCEL](new SagaCancellationException(
        'cancelled automatically by race effect'
      ))
    }

    ret.then(done, done)

    return ret
  }
}
