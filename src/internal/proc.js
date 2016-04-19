import { sym, noop, kTrue, is, log, isDev, check, deferred, autoInc, remove, TASK, makeIterator } from './utils'
import asap from './asap'
import { asEffect } from './io'
import * as monitorActions from './monitorActions'
import SagaCancellationException from './SagaCancellationException'
import { eventChannel, END } from './channel'


export const NOT_ITERATOR_ERROR = 'proc first argument (Saga function result) must be an iterator'
export const CANCEL = sym('@@redux-saga/cancelPromise')
export const PARALLEL_AUTO_CANCEL = 'PARALLEL_AUTO_CANCEL'
export const RACE_AUTO_CANCEL = 'RACE_AUTO_CANCEL'
export const FORK_AUTO_CANCEL = 'FORK_AUTO_CANCEL'
export const MANUAL_CANCEL = 'MANUAL_CANCEL'

const nextEffectId = autoInc()
const AUTO_END = { done: true, value: undefined }

const matchers = {
  wildcard  : () => kTrue,
  default   : pattern => input => input.type === pattern,
  array     : patterns => input => patterns.some( p => p === input.type ),
  predicate : predicate => input => predicate(input)
}

function matcher(pattern) {
  return (
      pattern === '*'   ? matchers.wildcard
    : is.array(pattern) ? matchers.array
    : is.func(pattern)  ? matchers.predicate
    : matchers.default
  )(pattern)
}

function forkQueue(cb) {
  let tasks = []

  function addTask(task) {
    tasks.push(task)
    task.cont = (err) => {
      remove(tasks, task)
      cb(err)
    }
    task.cont.cancel = task.cancel
  }

  function cancelAll(ex) {
    tasks.forEach(t => t.cancel(ex))
    tasks = []
  }

  return {
    addTask,
    cancelAll,
    getTasks: () => tasks,
    taskNames: () => tasks.map(t => t.name)
  }
}

export default function proc(
  iterator,
  subscribe = () => noop,
  dispatch = noop,
  getState = noop,
  monitor = noop,
  parentEffectId = 0,
  name = 'anonymous',
  cont
) {

  check(iterator, is.iterator, NOT_ITERATOR_ERROR)

  const stdChannel = eventChannel(subscribe)

  const taskQueue = forkQueue((err) => {
    if(err) {
      const ex = new SagaCancellationException(FORK_AUTO_CANCEL, name, name)
      if(!iterator._isMainRunning) {
        iterator._result = undefined
        taskQueue.cancelAll(ex)
        end(err)
      } else {
        cancel(ex)
        task.cont && task.cont(err)
      }
    } else if(!iterator._isMainRunning && !taskQueue.getTasks().length) {
      end(null, iterator._result)
    }
  })

  // Promise to be resolved/rejected when this generator terminates (or throws)
  //const deferredEnd = deferred()

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
  const task = newTask(parentEffectId, name, iterator, cont)

  /**
    This may be called by a parent generator to trigger/propagate cancellation
    We'll simply cancel the current effect, which will reject that effect
    The rejection will throw the injected SagaCancellationException into the flow
    of this generator
  **/
  function cancel({type, origin}) {
    if(iterator._isRunning && !iterator._isCancelled) {
      iterator._isCancelled = true
      const ex = new SagaCancellationException(type, name, origin)
      // 1. cancel the main task if it's still running
      if(iterator._isMainRunning) {
        next.cancel(ex)
        next(ex)
      }
      // 2. cancel all attached forks
      taskQueue.cancelAll(ex)

      // 3. cancel all joiners
      task.joiners.slice().forEach(j => j.task.cancel(ex))
      task.joiners = null
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
    We do not attach cancel to the .done promise. Because in join effects the
    sense of cancellation is inversed: cancellation of this task should cause
    the cancellation of all joiners
  **/
  cont && (cont.cancel = cancel)


  // tracks the running status
  iterator._isRunning = true
  iterator._isMainRunning = true

  // kicks up the generator
  next()

  // then return the task descriptor to the caller
  return task

  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(error, arg) {
    // Preventive measure. If we end up here, then there is really something wrong
    if(!iterator._isMainRunning)
      throw new Error('Trying to resume an already finished generator')

    try {
      let result
      if(error)
        result = iterator.throw(error)
      else if(arg === AUTO_END) {
        result = is.func(iterator.return) ? iterator.return(END) : AUTO_END
      } else
        result = iterator.next(arg)

      if(!result.done) {
         runEffect(result.value, parentEffectId, '', next)
      } else {
        //console.log(name, 'ended, pending tasks', taskQueue.taskNames())
        iterator._isMainRunning = false
        iterator._result = result.value
        if(!taskQueue.getTasks().length)
          end(null, result.value)
      }
    } catch(error) {
      iterator._isMainRunning = false
      if(error instanceof SagaCancellationException) {
        end()
        if(isDev) {
          log('warn', `${name}: uncaught`, error)
        }
      } else {
        taskQueue.cancelAll(
          new SagaCancellationException(FORK_AUTO_CANCEL, name, name)
        )
        end(error)
      }
    }
  }

  function end(error, result) {
    iterator._isRunning = false
    stdChannel.close()
    if(!error) {
      iterator._result = result
      iterator._deferredEnd && iterator._deferredEnd.resolve(result)
    } else {
      if(error instanceof Error)
        error.sagaStack = `at ${name} \n ${error.sagaStack || error.message}`
      if(!task.cont)
        log('error', `uncaught`, error.sagaStack || error.message)
      iterator._error = error
      iterator._deferredEnd && iterator._deferredEnd.reject(error)
    }
    if(!iterator._isCancelled) {
      task.cont && task.cont(error, result)
      task.joiners.forEach(j => j.cb(null, result))
      task.joiners = null
    }
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
      //cb(cancelError)
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
      : (is.notUndef(data = asEffect.channel(effect))) ? runChannelEffect(data, currCb)
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
    proc(iterator, subscribe, dispatch, getState, monitor, effectId, name, cb)
  }


  function runTakeEffect({channel, pattern, maybe}, cb) {
    channel = channel || stdChannel
    const takeCb = inp => (
        inp instanceof Error  ? cb(inp)
      : inp === END && !maybe ? cb(null, AUTO_END)
      : cb(null, inp)
    )
    channel.take(takeCb, matcher(pattern))
    cb.cancel = takeCb.cancel
  }

  function runPutEffect(action, cb) {
    /*
      Use a reentrant lock `asap` to flatten all nested dispatches
      If this put cause another Saga to take this action an then immediately
      put an action that will be taken by this Saga. Then the outer Saga will miss
      the action from the inner Saga b/c this put has not yet returned.
    */
    asap(() => {
      let result
      try {
        result = dispatch(action)
      } catch(error) {
        return cb(error)
      }

      if(is.promise(result)) {
        resolvePromise(result, cb)
      } else {
        cb(null, result)
      }
    })
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

  function runForkEffect({context, fn, args, detached}, effectId, cb) {
    let result, error, _iterator

    // we run the function, next we'll check if this is a generator function
    // (generator is a function that returns an iterator)

    // catch synchronous failures; see #152
    try {
      result = fn.apply(context, args)
    } catch(err) {
      if(!detached)
        return cb(err)
      else
        error = err
    }

    // A generator function: i.e. returns an iterator
    if( is.iterator(result) ) {
      _iterator = result
    }

    //simple effect: wrap in a generator
    // do not bubble up synchronous failures for detached forks, instead create a failed task. See #152
    else {
      _iterator = (error ?
          makeIterator(()=> { throw error })
        : makeIterator((function() {
            let pc
            const eff = {done: false, value: result}
            const ret = value => ({done: true, value})
            return arg => {
              if(!pc) {
                pc = true
                return eff
              } else {
                return ret(arg)
              }
            }
          })())
      )
    }

    let task = proc(_iterator, subscribe, dispatch, getState, monitor, effectId, fn.name, (detached ? null : noop))
    if(!detached) {
      if(_iterator._isRunning)
        taskQueue.addTask(task)
      else if(_iterator._error)
        return cb(_iterator._error)
    }
    cb(null, task)
    // Fork effects are non cancellables
  }

  function runJoinEffect(t, cb) {
    if(t.isRunning()) {
      const joiner = {task, cb}
      cb.cancel = () => remove(t.joiners, joiner)
      t.joiners.push(joiner)
    } else {
      cb(t.error(), t.result())
    }

  }

  function runCancelEffect(task, cb) {
    if(task.isRunning()) {
      task.cancel(
        new SagaCancellationException(MANUAL_CANCEL, name, name)
      )
    }
    task.cont && task.cont()
    cb()
    // cancel effects are non cancellables
  }

  // Reimplementing Promise.all
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
          // one of the effects failed or we got an END action
          if(err || res === END || res === AUTO_END) {
            // cancel all other effects
            // This is an AUTO_CANCEL (not triggered by a manual cancel)
            // Catch uncaught cancellation errors, because w'll only throw the actual
            // rejection error (err) inside this generator
            try {
              cb.cancel(
                new SagaCancellationException(PARALLEL_AUTO_CANCEL, name, name)
              )
            } catch(err) { void(0) }

            err ? cb(err) : cb(null, res)
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
        } else if(res !== END && res !== AUTO_END) {
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

  function runChannelEffect({pattern, buffer=10}, cb) {
    cb(null, eventChannel(subscribe, matcher(pattern), buffer))
  }


  function newTask(id, name, iterator, cont) {
    iterator._deferredEnd = null
    return {
      [TASK]: true,
      id,
      name,
      get done() {
        if(iterator._deferredEnd)
          return iterator._deferredEnd.promise
        else {
          const def = deferred()
          iterator._deferredEnd = def
          if(!iterator._isRunning)
            iterator._error ? def.reject(iterator._error) : def.resolve(iterator._result)
          return def.promise
        }
      },
      cont,
      joiners: [],
      cancel: error => {
        if(!(error instanceof SagaCancellationException)) {
          error = new SagaCancellationException(MANUAL_CANCEL, name, error)
        }
        cancel(error)
      },
      isRunning: () => iterator._isRunning,
      isCancelled: () => iterator._isCancelled,
      result: () => iterator._result,
      error: () => iterator._error
    }
  }

}
