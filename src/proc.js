import { is, check, TASK } from './utils'
import { as, matcher } from './io'

export const NOT_ITERATOR_ERROR = "proc first argument must be an iterator"

export default function proc(iterator, subscribe=()=>()=>{}, dispatch=()=>{}) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  let deferredInput, deferredEnd
  const canThrow = is.throw(iterator)

  const endP = new Promise((resolve, reject) => deferredEnd = {resolve, reject})

  const unsubscribe = subscribe(input => {
    if(deferredInput && deferredInput.match(input))
      deferredInput.resolve(input)
  })

  iterator._isRunning = true
  iterator._next = next
  next()

  return endP

  function next(arg, isError) {
    //console.log('next', arg, isError)
    deferredInput = null
    try {
      if(isError && !canThrow)
        throw arg
      const result = isError ? iterator.throw(arg) : iterator.next(arg)

      if(!result.done) {
        //console.log('yield', name, result.value)
        runEffect(result.value).then(next, err => next(err, true))
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
    }
  }

  function runEffect(effect) {
    let data
    return (
        is.array(effect)           ? Promise.all(effect.map(runEffect))
      : is.iterator(effect)        ? proc(effect, subscribe, dispatch)

      : (data = as.take(effect))   ? runTakeEffect(data)
      : (data = as.put(effect))    ? runPutEffect(data)
      : (data = as.race(effect))   ? runRaceEffect(data)
      : (data = as.call(effect))   ? runCallEffect(data.fn, data.args)
      : (data = as.cps(effect))    ? runCPSEffect(data.fn, data.args)
      : (data = as.fork(effect))    ? runForkEffect(data.task, data.args)
      : (data = as.join(effect))    ? runJoinEffect(data)

      : /* resolve anything else  */ Promise.resolve(effect)
    )
  }

  function runTakeEffect(pattern) {
    return new Promise(resolve => {
      deferredInput = { resolve, match : matcher(pattern), pattern }
    })
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
      error: () => _iterator._error,
      cancel: err => _iterator._next(err, true)
    }
    return Promise.resolve(taskDesc)
  }

  function runJoinEffect(task) {
    return task._done
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
