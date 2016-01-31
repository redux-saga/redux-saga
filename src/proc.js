import { noop, is, isDev, check, remove, deferred, autoInc, asap, TASK } from './utils'
import { as, matcher } from './io'
import * as monitorActions from './monitorActions'
import SagaCancellationException from './SagaCancellationException'


export const NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator'
export const CANCEL = Symbol('@@redux-saga/cancelPromise')
export const PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL'
export const RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL'
export const MANUAL_CANCEL = 'MANUAL_CANCEL'

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

  // tracks the current `take` effects
  let deferredInputs = []
  const canThrow = is.throw(iterator)
  // Promise to be resolved/rejected when this generator terminates (or throws)
  const deferredEnd = deferred()

  // subscribe to input events, this will resolve the current `take` effects
  const unsubscribe = subscribe(input => {
    for (let i = 0; i < deferredInputs.length; i++) {
      const def = deferredInputs[i]
      if(def.match(input)) {
        // cancel all deferredInputs; parallel takes are disallowed
        // and in concurrent takes, first wins
        deferredInputs = []
        def.resolve(input)
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
    parentEffectId, name, iterator, deferredEnd.promise
  )

  /**
    this maybe called by a parent generator to trigger/propagate cancellation
    W'll simply cancel the current effect, which will reject that effect
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
    This is the generator driver
    It's a recursive aysnc/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(error, arg) {
    // Preventive measure. If we endup here, then there is really something wrong
    if(!iterator._isRunning)
      throw new Error('Trying to resume an already finished generator')

    try {
      if(error && !canThrow)
        throw error

      // calling iterator.throw on a generator that doesnt defined a correponding try/Catch
      const result = error ? iterator.throw(error) : iterator.next(arg)
      if(!result.done) {
         runEffect(result.value, parentEffectId, '', next)
      } else {
        end(result.value)
      }
    } catch(error) {
      /*eslint-disable no-console*/
      if(isDev) {
        console.warn(`${name}: uncaught`, error )
      }
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
      : (is.notUndef(data = as.take(effect)))   ? runTakeEffect(data, currCb)
      : (is.notUndef(data = as.put(effect)))    ? runPutEffect(data, currCb)
      : (is.notUndef(data = as.race(effect)))   ? runRaceEffect(data, effectId, currCb)
      : (is.notUndef(data = as.call(effect)))   ? runCallEffect(data, effectId, currCb)
      : (is.notUndef(data = as.cps(effect)))    ? runCPSEffect(data, currCb)
      : (is.notUndef(data = as.fork(effect)))   ? runForkEffect(data, effectId, currCb)
      : (is.notUndef(data = as.join(effect)))   ? runJoinEffect(data, currCb)
      : (is.notUndef(data = as.cancel(effect))) ? runCancelEffect(data, currCb)
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
      proc(iterator, subscribe, dispatch, monitor, effectId, name).done,
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
    const result = fn.apply(context, args)
    return (
        is.promise(result)  ? resolvePromise(result, cb)
      : is.iterator(result) ? resolveIterator(result, effectId, fn.name, cb)
      : cb(null, result)
    )
  }

  function runCPSEffect({context, fn, args}, cb) {
    // CPS (ie node style functions) can define their own cancellation logic
    // by setting cancel field on the cb
    fn.apply(context, args.concat(cb))
  }

  function runForkEffect({context, fn, args}, effectId, cb) {
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

    cb(
      null,
      proc(_iterator, subscribe, dispatch, monitor, effectId, fn.name, true)
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
    let completedCount = 0
    let completed
    const results = Array(effects.length)

    const childCbs = effects.map( (eff, idx) => {
        const chCbAtIdx = (err, res) => {
          // Either we've  been cancelled, or an error aborted the whole effect
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
            if(completedCount === results.length) {
              completed = true
              cb(null, results)
            }
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

}
