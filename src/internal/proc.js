import { sym, noop, is, isDev, check, remove, deferred, autoInc, asap, TASK } from './utils'
import { asEffect, matcher } from './io'
import * as monitorActions from './monitorActions'
import SagaCancellationException from './SagaCancellationException'


export const NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator'
export const undefindInputError = name => `
  ${name} saga was provided with an undefined input action
  Hints :
  - check that your Action Creator returns a non undefined value
  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners
`

export const CANCEL = sym('@@redux-saga/cancelPromise')
export const PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL'
export const RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL'
export const MANUAL_CANCEL = 'MANUAL_CANCEL'

const nextEffectId = autoInc()

export default function proc(
  iterator,
  subscribe = () => noop,
  dispatch = noop,
  getState = noop,
  monitor = noop,
  parentEffectId = 0,
  name = 'anonymous',
  forked
) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  const UNDEFINED_INPUT_ERROR = undefindInputError(name)

  // tracks the current `take` effects
  let deferredInputs = []

  // Promise to be resolved/rejected when this generator terminates (or throws)
  const deferredEnd = deferred()

  // subscribe to input events, this will resolve the current `take` effects
  const unsubscribe = subscribe(input => {
    if(input === undefined)
      throw UNDEFINED_INPUT_ERROR

    const arr = deferredInputs
    deferredInputs = []
    for (let i = 0, len = arr.length; i < len; i++) {
      const def = arr[i]
      if(def.match(input)) {
        def.resolve(input)
      } else {
        deferredInputs.push(def)
      }
    }
  })

  /**
    cancel : (SagaCancellationException) -> ()

    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/
  next.cancel = noop

  /**
    Creates a new task descriptor for this generator
  **/
  const task = newTask(
    parentEffectId, name, iterator, deferredEnd.promise, forked
  )

  /**
    This may be called by a parent generator to trigger/propagate cancellation
    We'll simply cancel the current effect, which will reject that effect
    The rejection will throw the injected SagaCancellationException into the flow
    of this generator
  **/
  task.done[CANCEL] = ({type, origin}) => {
    next.cancel(
      new SagaCancellationException(type, name, origin)
    )
  }

  // tracks the running status
  iterator._isRunning = true

  // kicks up the generator
  next()

  // then return the task descriptor to the caller
  return task

  /**
    Print error in a useful way whether in a browser environment
    (with expandable error stack traces), or in a node.js environment
    (text-only log output)
   **/
  function logError(level, message, error) {
    /*eslint-disable no-console*/
    if (typeof window === 'undefined') {
      console.log(`redux-saga ${level}: ${message}\n${error.stack}`)
    } else {
      console[level].call(console, message, error)
    }
  }

  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(error, arg) {
    // Preventive measure. If we end up here, then there is really something wrong
    if(!iterator._isRunning)
      throw new Error('Trying to resume an already finished generator')


    try {
      // calling iterator.throw on a generator that doesn't define a correponding try/Catch
      // will throw an exception and jump to the catch block below
      const result = error ? iterator.throw(error) : iterator.next(arg)
      if(!result.done) {
         runEffect(result.value, parentEffectId, '', next)
      } else {
        end(result.value)
      }
    } catch(error) {
      end(error, true)

      if(error instanceof SagaCancellationException) {
        if(isDev) {
          logError('warn', `${name}: uncaught`, error)
        }
      } else {
        logError('error', `${name}: uncaught`, error)
        //if(!forked)
        //  throw error
      }
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

  function runEffect(effect, parentEffectId, label = '', cb) {
    const effectId = nextEffectId()
    monitor( monitorActions.effectTriggered(effectId, parentEffectId, label, effect) )

    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/
    let effectSettled

    // Completion callback passed to the appropriate effect runner
    function currCb(err, res) {
      if(effectSettled)
        return

      effectSettled = true
      cb.cancel = noop // defensive measure
      err ?
          monitor( monitorActions.effectRejected(effectId, err) )
        : monitor( monitorActions.effectResolved(effectId, res) )

      cb(err, res)
    }
    // tracks down the current cancel
    currCb.cancel = noop

    // setup cancellation logic on the parent cb
    cb.cancel = (cancelError) => {
      // prevents cancelling an already completed effect
      if(effectSettled)
        return

      effectSettled = true
      /**
        propagates cancel downward
        catch uncaught cancellations errors,
        because w'll throw our own cancellation error inside this generator
      **/
      try { currCb.cancel(cancelError) } catch(err) { void(0); }
      currCb.cancel = noop // defensive measure

      /**
        triggers/propagates the cancellation error
      **/
      cb(cancelError)
      monitor( monitorActions.effectRejected(effectId, cancelError) )
    }


    /**
      each effect runner must attach its own logic of cancellation to the provided callback
      it allows this generator to propagate cancellation downward.

      ATTENTION! effect runners must setup the cancel logic by setting cb.cancel = [cancelMethod]
      And the setup must occur before calling the callback

      This is a sort of inversion of control: called async functions are responsible
      of completing the flow by calling the provided continuation; while caller functions
      are responsible for aborting the current flow by calling the attached cancel function

      Library users can attach their own cancellation logic to promises by defining a
      promise[CANCEL] method in their returned promises
      ATTENTION! calling cancel must have no effect on an already completed or cancelled effect
    **/
    let data
    return (
      // Non declarative effect
        is.promise(effect)  ? resolvePromise(effect, currCb)
      : is.iterator(effect) ? resolveIterator(effect, effectId, name, currCb)

      // declarative effects
      : is.array(effect)                        ? runParallelEffect(effect, effectId, currCb)
      : (is.notUndef(data = asEffect.take(effect)))   ? runTakeEffect(data, currCb)
      : (is.notUndef(data = asEffect.put(effect)))    ? runPutEffect(data, currCb)
      : (is.notUndef(data = asEffect.race(effect)))   ? runRaceEffect(data, effectId, currCb)
      : (is.notUndef(data = asEffect.call(effect)))   ? runCallEffect(data, effectId, currCb)
      : (is.notUndef(data = asEffect.cps(effect)))    ? runCPSEffect(data, currCb)
      : (is.notUndef(data = asEffect.fork(effect)))   ? runForkEffect(data, effectId, currCb)
      : (is.notUndef(data = asEffect.join(effect)))   ? runJoinEffect(data, currCb)
      : (is.notUndef(data = asEffect.cancel(effect))) ? runCancelEffect(data, currCb)
      : (is.notUndef(data = asEffect.select(effect))) ? runSelectEffect(data, currCb)
      : /* anything else returned as is        */ currCb(null, effect)
    )



  }

  function resolvePromise(promise, cb) {
    const cancelPromise = promise[CANCEL]
    if(typeof cancelPromise === 'function') {
      cb.cancel = cancelPromise
    }
    promise.then(
      result => cb(null, result),
      error  => cb(error)
    )
  }

  function resolveIterator(iterator, effectId, name, cb) {
    resolvePromise(
      proc(iterator, subscribe, dispatch, getState, monitor, effectId, name).done,
      cb
    )
  }

  function runTakeEffect(pattern, cb) {
    const def = {
      match : matcher(pattern),
      pattern,
      resolve: input => cb(null, input)
    }
    deferredInputs.push(def)
    // cancellation logic for take effect
    cb.cancel = () => remove(deferredInputs, def)
  }

  function runPutEffect(action, cb) {
    //synchronously nested dispatches can not be performed
    // because on a sync interleaved take/put the receiver will dispatch the
    // action before the sender can take the aknowledge
    // this workaround allows the dispatch to occur on the next microtask
    asap(() => cb(null, dispatch(action)))
    // Put effects are non cancellables
  }

  function runCallEffect({context, fn, args}, effectId, cb) {
    let result
    // catch synchronous failures; see #152
    try {
      result = fn.apply(context, args)
    } catch(error) {
      return cb(error)
    }
    return (
        is.promise(result)  ? resolvePromise(result, cb)
      : is.iterator(result) ? resolveIterator(result, effectId, fn.name, cb)
      : cb(null, result)
    )
  }

  function runCPSEffect({context, fn, args}, cb) {
    // CPS (ie node style functions) can define their own cancellation logic
    // by setting cancel field on the cb

    // catch synchronous failures; see #152
    try {
      fn.apply(context, args.concat(cb))
    } catch(error) {
      return cb(error)
    }
  }

  function runForkEffect({context, fn, args}, effectId, cb) {
    let result, error, _iterator

    // we run the function, next we'll check if this is a generator function
    // (generator is a function that returns an iterator)

    // catch synchronous failures; see #152
    try {
      result = fn.apply(context, args)
    } catch(err) {
      error = error
    }

    // A generator function: i.e. returns an iterator
    if( is.iterator(result) ) {
      _iterator = result
    }

    //simple effect: wrap in a generator
    // do not bubble up synchronous failures, instead create a failed task. See #152
    else {
      _iterator = (error ?
          function*() { throw error }
        : function*() { return (yield result) }
      )()
    }

    cb(
      null,
      proc(_iterator, subscribe, dispatch, getState, monitor, effectId, fn.name, true)
    )
    // Fork effects are non cancellables
  }

  function runJoinEffect(task, cb) {
    resolvePromise(task.done, cb)
  }

  function runCancelEffect(task, cb) {
    // cancel the given task
    // uncaught cancellations errors bubbles upward
    task.done[CANCEL](
      new SagaCancellationException(MANUAL_CANCEL, name, name)
    )
    cb()
    // cancel effects are non cancellables
  }

  // Reimplementing Promise.all. We're in 2016
  function runParallelEffect(effects, effectId, cb) {
    if(!effects.length) {
      cb(null, [])
      return
    }

    let completedCount = 0
    let completed
    const results = Array(effects.length)

    function checkEffectEnd() {
      if(completedCount === results.length) {
        completed = true
        cb(null, results)
      }
    }

    const childCbs = effects.map( (eff, idx) => {
        const chCbAtIdx = (err, res) => {
          // Either we've been cancelled, or an error aborted the whole effect
          if(completed)
            return
          // one of the effects failed
          if(err) {
            // cancel all other effects
            // This is an AUTO_CANCEL (not triggered by a manual cancel)
            // Catch uncaught cancellation errors, because w'll only throw the actual
            // rejection error (err) inside this generator
            try {
              cb.cancel(
                new SagaCancellationException(PARALLEL_AUTO_CANCEL, name, name)
              )
            } catch(err) { void(0) }

            cb(err)
          } else {
            results[idx] = res
            completedCount++
            checkEffectEnd()
          }
        }
        chCbAtIdx.cancel = noop
        return chCbAtIdx
    })

    // This is different, a cancellation coming from upward
    // either a MANUAL_CANCEL or a parent AUTO_CANCEL
    // No need to catch, will be swallowed by the caller
    cb.cancel = cancelError => {
      // prevents unnecessary cancellation
      if(!completed) {
        completed = true
        childCbs.forEach(chCb => chCb.cancel(cancelError))
      }
    }

    effects.forEach( (eff, idx) => runEffect(eff, effectId, idx, childCbs[idx]) )
  }

  // And yet; Promise.race
  function runRaceEffect(effects, effectId, cb) {
    let completed
    const keys = Object.keys(effects)
    const childCbs = {}

    keys.forEach(key => {
      const chCbAtKey = (err, res) => {
        // Either we've  been cancelled, or an error aborted the whole effect
        if(completed)
          return

        if(err) {
          // Race Auto cancellation
          try {
            cb.cancel(
              new SagaCancellationException(RACE_AUTO_CANCEL, name, name)
            )
          } catch(err) { void(0) }

          cb({[key]: err})
        } else {
          try {
            cb.cancel(
              new SagaCancellationException(RACE_AUTO_CANCEL, name, name)
            )
          } catch(err) { void(0) }
          completed = true
          cb(null, {[key]: res})
        }
      }
      chCbAtKey.cancel = noop
      childCbs[key] = chCbAtKey
    })

    cb.cancel = cancelError => {
      // prevents unnecessary cancellation
      if(!completed) {
        completed = true
        keys.forEach(key => childCbs[key].cancel(cancelError))
      }
    }
    keys.forEach(key => runEffect(effects[key], effectId, key, childCbs[key]))
  }

  function runSelectEffect({selector, args}, cb) {
    try {
      const state = selector(getState(), ...args)
      cb(null, state)
    } catch(error) {
      cb(error)
    }
  }

  function newTask(id, name, iterator, done, forked) {
    return {
      [TASK]: true,
      id,
      name,
      done,
      forked,
      cancel: error => {
        if(!(error instanceof SagaCancellationException)) {
          error = new SagaCancellationException(MANUAL_CANCEL, name, error)
        }
        done[CANCEL](error)
      },
      isRunning: () => iterator._isRunning,
      result: () => iterator._result,
      error: () => iterator._error
    }
  }

}
