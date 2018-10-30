import deferred from '@redux-saga/deferred'
import * as is from '@redux-saga/is'
import { CANCEL, IO, TASK, TASK_CANCEL } from '@redux-saga/symbols'
import effectRunnerMap from './effectRunnerMap'
import {
  noop,
  check,
  uid as nextEffectId,
  remove,
  assignWithSymbols,
  createSetContextWarning,
  shouldCancel,
  shouldTerminate,
  asyncIteratorSymbol,
} from './utils'

import { addSagaStack, sagaStackToString } from './error-utils'

/**
  Used to track a parent task and its forks
  In the new fork model, forked tasks are attached by default to their parent
  We model this using the concept of Parent task && main Task
  main task is the main flow of the current Generator, the parent tasks is the
  aggregation of the main tasks + all its forked tasks.
  Thus the whole model represents an execution tree with multiple branches (vs the
  linear execution tree in sequential (non parallel) programming)

  A parent tasks has the following semantics
  - It completes if all its forks either complete or all cancelled
  - If it's cancelled, all forks are cancelled as well
  - It aborts if any uncaught error bubbles up from forks
  - If it completes, the return value is the one returned by the main task
**/
function forkQueue(mainTask, onAbort, cb) {
  let tasks = [],
    result,
    completed = false
  addTask(mainTask)
  const getTasks = () => tasks
  const getTaskNames = () => tasks.map(t => t.meta.name)

  function abort(err) {
    onAbort()
    cancelAll()
    cb(err, true)
  }

  function addTask(task) {
    tasks.push(task)
    task.cont = (res, isErr) => {
      if (completed) {
        return
      }

      remove(tasks, task)
      task.cont = noop
      if (isErr) {
        abort(res)
      } else {
        if (task === mainTask) {
          result = res
        }
        if (!tasks.length) {
          completed = true
          cb(result)
        }
      }
    }
    // task.cont.cancel = task.cancel
  }

  function cancelAll() {
    if (completed) {
      return
    }
    completed = true
    tasks.forEach(t => {
      t.cont = noop
      t.cancel()
    })
    tasks = []
  }

  return {
    addTask,
    cancelAll,
    abort,
    getTasks,
    getTaskNames,
  }
}

export default function proc(env, iterator, parentContext, parentEffectId, meta, isRoot, cont) {
  if (process.env.NODE_ENV !== 'production' && iterator[asyncIteratorSymbol]) {
    throw new Error("redux-saga doesn't support async generators, please use only regular ones")
  }
  const taskContext = Object.create(parentContext)
  const finalRunEffect = env.finalizeRunEffect(runEffect)

  let crashedEffect = null
  const cancelledDueToErrorTasks = []
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
  const task = newTask(parentEffectId, meta, isRoot, cont)
  const mainTask = { meta, cancel: cancelMain, _isRunning: true, _isCancelled: false }

  const taskQueue = forkQueue(
    mainTask,
    function onAbort() {
      cancelledDueToErrorTasks.push(...taskQueue.getTaskNames())
    },
    end,
  )

  /**
    cancellation of the main task. We'll simply resume the Generator with a Cancel
  **/
  function cancelMain() {
    if (mainTask._isRunning && !mainTask._isCancelled) {
      mainTask._isCancelled = true
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
    if (task._isRunning && !task._isCancelled) {
      task._isCancelled = true
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
  cont.cancel = cancel

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
    if (!mainTask._isRunning) {
      throw new Error('Trying to resume an already finished generator')
    }

    try {
      let result
      if (isErr) {
        result = iterator.throw(arg)
      } else if (shouldCancel(arg)) {
        /**
          getting TASK_CANCEL automatically cancels the main task
          We can get this value here

          - By cancelling the parent task manually
          - By joining a Cancelled task
        **/
        mainTask._isCancelled = true
        /**
          Cancels the current effect; this will propagate the cancellation down to any called tasks
        **/
        next.cancel()
        /**
          If this Generator has a `return` method then invokes it
          This will jump to the finally block
        **/
        result = is.func(iterator.return) ? iterator.return(TASK_CANCEL) : { done: true, value: TASK_CANCEL }
      } else if (shouldTerminate(arg)) {
        // We get TERMINATE flag, i.e. by taking from a channel that ended using `take` (and not `takem` used to trap End of channels)
        result = is.func(iterator.return) ? iterator.return() : { done: true }
      } else {
        result = iterator.next(arg)
      }

      if (!result.done) {
        digestEffect(result.value, parentEffectId, '', next)
      } else {
        /**
          This Generator has ended, terminate the main task and notify the fork queue
        **/
        mainTask._isRunning = false
        mainTask.cont(result.value)
      }
    } catch (error) {
      if (mainTask._isCancelled) {
        env.logError(error)
      }
      mainTask._isRunning = false
      mainTask.cont(error, true)
    }
  }

  function end(result, isErr) {
    task._isRunning = false

    if (!isErr) {
      task._result = result
      task._deferredEnd && task._deferredEnd.resolve(result)
    } else {
      addSagaStack(result, {
        meta,
        effect: crashedEffect,
        cancelledTasks: cancelledDueToErrorTasks,
      })

      if (task.isRoot) {
        if (result && result.sagaStack) {
          result.sagaStack = sagaStackToString(result.sagaStack)
        }

        if (env.onError) {
          env.onError(result)
        }
        if (env.logError) {
          // TODO: could we skip this when _deferredEnd is attached?
          env.logError(result)
        }
      }
      task._error = result
      task._isAborted = true
      task._deferredEnd && task._deferredEnd.reject(result)
    }
    task.cont(result, isErr)
    task.joiners.forEach(j => j.cb(result, isErr))
    task.joiners = null
  }

  function runEffect(effect, effectId, currCb) {
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
      resolveIterator(effect, effectId, meta, currCb)
    } else if (effect && effect[IO]) {
      const executingContext = {
        effectId,
        task,
        taskContext,
        mainTask,
        taskQueue,
        digestEffect,
        resolvePromise,
        resolveIterator,
      }
      const effectRunner = effectRunnerMap[effect.type]
      effectRunner(env, effect.payload, currCb, executingContext)
    } else {
      // anything else returned as is
      currCb(effect)
    }
  }

  function digestEffect(effect, parentEffectId, label = '', cb) {
    const effectId = nextEffectId()
    env.sagaMonitor && env.sagaMonitor.effectTriggered({ effectId, parentEffectId, label, effect })

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
      if (env.sagaMonitor) {
        if (isErr) {
          env.sagaMonitor.effectRejected(effectId, res)
        } else {
          env.sagaMonitor.effectResolved(effectId, res)
        }
      }
      if (isErr) {
        crashedEffect = effect
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
      } catch (err) {
        env.logError(err)
      }
      currCb.cancel = noop // defensive measure

      env.sagaMonitor && env.sagaMonitor.effectCancelled(effectId)
    }

    finalRunEffect(effect, effectId, currCb)
  }

  function resolvePromise(promise, cb) {
    const cancelPromise = promise[CANCEL]
    if (is.func(cancelPromise)) {
      cb.cancel = cancelPromise
    } else if (is.func(promise.abort)) {
      cb.cancel = () => promise.abort()
    }
    promise.then(cb, error => cb(error, true))
  }

  function resolveIterator(iterator, effectId, meta, cb) {
    proc(env, iterator, taskContext, effectId, meta, /* isRoot */ false, cb)
  }

  function newTask(id, meta, isRoot, cont) {
    const task = {
      [TASK]: true,
      id,
      meta,
      isRoot,
      _deferredEnd: null,
      toPromise() {
        if (task._deferredEnd) {
          return task._deferredEnd.promise
        }

        const def = deferred()
        task._deferredEnd = def

        if (!task._isRunning) {
          if (task._isAborted) {
            def.reject(task._error)
          } else {
            def.resolve(task._result)
          }
        }

        return def.promise
      },
      cont,
      joiners: [],
      cancel,
      _isRunning: true,
      _isCancelled: false,
      _isAborted: false,
      _result: undefined,
      _error: undefined,
      isRunning: () => task._isRunning,
      isCancelled: () => task._isCancelled,
      isAborted: () => task._isAborted,
      result: () => task._result,
      error: () => task._error,
      setContext(props) {
        if (process.env.NODE_ENV !== 'production') {
          check(props, is.object, createSetContextWarning('task', props))
        }

        assignWithSymbols(taskContext, props)
      },
    }
    return task
  }
}
