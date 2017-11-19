import { TASK } from './symbols'
import { CHANNEL_END, TASK_CANCEL } from './completionValues'

import { noop, is, check, deferred, uid as nextEffectId, object, createSetContextWarning } from './utils'

import effectRunners, { resolvePromise } from './effectRunners'
import forkQueue from './forkQueue'

export default function proc(iterator, parentState, parentEffectId, taskContinuation, name = 'anonymous') {
  const { sagaMonitor, onError, middleware } = parentState

  // TODO: worth refactoring ain't sure if this isn't somewhat costly for deep task trees in v8
  // chaining it like this might create multiple hidden classes and the lookup to the root object might also be costly
  // in theory it need to traverse each prototype to find it, don't know if v8 optimize this
  const sagaState = Object.create(parentState)
  sagaState.taskContext = Object.create(parentState.taskContext)

  /**
    Tracks the current effect cancellation
    Each time the generator progresses. calling runEffect will set a new value
    on it. It allows propagating cancellation to child effects
  **/
  next.cancel = noop

  /**
    Creates a new task descriptor for this generator, We'll also create a main task
    to track the main flow (besides other forked tasks)
  **/
  const task = newTask(parentEffectId, name, iterator, taskContinuation)
  sagaState.task = task

  const mainTask = { name, cancel: cancelMain, isRunning: true }
  sagaState.mainTask = mainTask
  const taskQueue = forkQueue(name, mainTask, end)
  sagaState.taskQueue = taskQueue

  sagaState.triggerEffect = triggerEffect

  /**
    cancellation of the main task. We'll simply resume the Generator with a Cancel
  **/
  function cancelMain() {
    if (mainTask.isRunning && !mainTask.isCancelled) {
      mainTask.isCancelled = true
      next(TASK_CANCEL)
    }
  }

  /**
    This may be called by a parent generator to trigger/propagate cancellation
    cancel all pending tasks (including the main task), then end the current task.

    Cancellation propagates down to the whole execution tree holded by this Parent task
    It's also propagated to all joiners of this task and their execution tree/joiners

    Cancellation is noop for terminated/Cancelled tasks tasks
  **/
  function cancel() {
    /**
      We need to check both Running and Cancelled status
      Tasks can be Cancelled but still Running
    **/
    if (iterator._isRunning && !iterator._isCancelled) {
      iterator._isCancelled = true
      taskQueue.cancelAll()
      /**
        Ending with a Never result will propagate the Cancellation to all joiners
      **/
      end(TASK_CANCEL)
    }
  }
  /**
    attaches cancellation logic to this task's continuation
    this will permit cancellation to propagate down the call chain
  **/
  if (taskContinuation !== null) {
    taskContinuation.cancel = cancel
  }

  // tracks the running status
  iterator._isRunning = true

  // kicks up the generator
  next()

  // then return the task descriptor to the caller
  return task

  /**
    This is the generator driver
    It's a recursive async/continuation function which calls itself
    until the generator terminates or throws
  **/
  function next(arg, isErr) {
    // Preventive measure. If we end up here, then there is really something wrong
    if (!mainTask.isRunning) {
      throw new Error('Trying to resume an already finished generator')
    }

    try {
      let result
      if (isErr) {
        result = iterator.throw(arg)
      } else if (arg === TASK_CANCEL) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here

          - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask.isCancelled = true
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/
        next.cancel()
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/
        result = is.func(iterator.return) ? iterator.return(TASK_CANCEL) : { done: true, value: TASK_CANCEL }
      } else if (arg === CHANNEL_END) {
        // We get CHANNEL_END by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = is.func(iterator.return) ? iterator.return() : { done: true }
      } else {
        result = iterator.next(arg)
      }

      if (!result.done) {
        triggerEffect(result.value, parentEffectId, '', next)
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        mainTask.isMainRunning = false
        mainTask.continuation(result.value)
      }
    } catch (error) {
      mainTask.isMainRunning = false
      mainTask.continuation(error, true)
    }
  }

  function end(result, isErr) {
    iterator._isRunning = false

    if (!isErr) {
      iterator._result = result
      iterator._deferredEnd && iterator._deferredEnd.resolve(result)
    } else {
      if (taskContinuation === null) {
        onError(result)
      }
      iterator._error = result
      iterator._isAborted = true
      iterator._deferredEnd && iterator._deferredEnd.reject(result)
    }
    if (task.continuation) {
      task.continuation(result, isErr)
    }
    task.joiners.forEach(j => j.cb(result, isErr))
    task.joiners = null
  }

  function runEffect(effect, effectId, label = '', currCb) {
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

    if (is.promise(effect)) {
      resolvePromise(effect, currCb)
    } else if (is.iterator(effect)) {
      proc(effect, sagaState, effectId, currCb)
    } else if (is.effect(effect)) {
      const { type, payload } = effect
      effectRunners[type](payload, currCb, sagaState, effectId)
    } else {
      // anything else returned as is
      currCb(effect)
    }
  }

  function triggerEffect(effect, parentEffectId, label = '', cb) {
    const effectId = nextEffectId()
    sagaMonitor && sagaMonitor.effectTriggered({ effectId, parentEffectId, label, effect })

    /**
      completion callback and cancel callback are mutually exclusive
      We can't cancel an already completed effect
      And We can't complete an already cancelled effectId
    **/
    let effectSettled

    // Completion callback passed to the appropriate effect runner
    function currCb(res, isErr) {
      if (effectSettled) {
        return
      }

      effectSettled = true
      cb.cancel = noop // defensive measure
      if (sagaMonitor) {
        isErr ? sagaMonitor.effectRejected(effectId, res) : sagaMonitor.effectResolved(effectId, res)
      }
      cb(res, isErr)
    }
    // tracks down the current cancel
    currCb.cancel = noop

    // setup cancellation logic on the parent cb
    cb.cancel = () => {
      // prevents cancelling an already completed effect
      if (effectSettled) {
        return
      }

      effectSettled = true
      /**
        propagates cancel downward
        catch uncaught cancellations errors; since we can no longer call the completion
        callback, log errors raised during cancellations into the console
      **/
      try {
        currCb.cancel()
        // eslint-disable-next-line no-empty
      } catch {}
      currCb.cancel = noop // defensive measure

      sagaMonitor && sagaMonitor.effectCancelled(effectId)
    }

    // if one can find a way to decouple runEffect from closure variables
    // so the call to it could be referentially transparent
    // this potentially could be simplified, finalRunEffect created beforehand
    // and this part of the code wouldnt have to know about middleware stuff
    if (is.func(middleware)) {
      middleware(eff => runEffect(eff, effectId, label, currCb))(effect)
      return
    }

    runEffect(effect, effectId, label, currCb)
  }

  function newTask(id, name, iterator, continuation) {
    iterator._deferredEnd = null
    return {
      [TASK]: true,
      id,
      name,
      toPromise() {
        if (iterator._deferredEnd) {
          return iterator._deferredEnd.promise
        }

        const def = deferred()
        iterator._deferredEnd = def

        if (!iterator._isRunning) {
          if (iterator._isAborted) {
            def.reject(iterator._error)
          } else {
            def.resolve(iterator._result)
          }
        }

        return def.promise
      },
      continuation,
      joiners: [],
      cancel,
      isRunning: () => iterator._isRunning,
      isCancelled: () => iterator._isCancelled,
      isAborted: () => iterator._isAborted,
      result: () => iterator._result,
      error: () => iterator._error,
      setContext(props) {
        if (process.env.NODE_ENV === 'development') {
          check(props, is.object, createSetContextWarning('task', props))
        }

        object.assign(sagaState.taskContext, props)
      },
    }
  }
}
