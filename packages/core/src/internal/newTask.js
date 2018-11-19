import deferred from '@redux-saga/deferred'
import * as is from '@redux-saga/is'
import { TASK, TASK_CANCEL } from '@redux-saga/symbols'
import { assignWithSymbols, check, createSetContextWarning } from './utils'
import { addSagaStack, sagaStackToString } from './error-utils'
import forkQueue from './forkQueue'

export default function newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont) {
  let running = true
  let cancelled = false
  let aborted = false
  let taskResult
  let taskError
  let deferredEnd = null

  const cancelledDueToErrorTasks = []

  const context = Object.create(parentContext)
  const queue = forkQueue(
    mainTask,
    function onAbort() {
      cancelledDueToErrorTasks.push(...queue.getTaskNames())
    },
    end,
  )

  /**
   This may be called by a parent generator to trigger/propagate cancellation
   cancel all pending tasks (including the main task), then end the current task.

   Cancellation propagates down to the whole execution tree holded by this Parent task
   It's also propagated to all joiners of this task and their execution tree/joiners

   Cancellation is noop for terminated/Cancelled tasks tasks
   **/
  function cancel() {
    // We need to check both Running and Cancelled status
    // Tasks can be Cancelled but still Running
    if (running && !cancelled) {
      cancelled = true
      queue.cancelAll()
      // Ending with a TASK_CANCEL will propagate the Cancellation to all joiners
      end(TASK_CANCEL)
    }
  }

  function end(result, isErr) {
    running = false

    if (!isErr) {
      taskResult = result
      deferredEnd && deferredEnd.resolve(result)
    } else {
      addSagaStack(result, {
        meta,
        effect: task.crashedEffect,
        cancelledTasks: cancelledDueToErrorTasks,
      })

      if (task.isRoot) {
        if (result && result.sagaStack) {
          result.sagaStack = sagaStackToString(result.sagaStack)
        }

        env.onError(result)
      }
      taskError = result
      aborted = true
      deferredEnd && deferredEnd.reject(result)
    }
    task.cont(result, isErr)
    task.joiners.forEach(j => j.cb(result, isErr))
    task.joiners = null
  }

  function setContext(props) {
    if (process.env.NODE_ENV !== 'production') {
      check(props, is.object, createSetContextWarning('task', props))
    }

    assignWithSymbols(context, props)
  }

  function toPromise() {
    if (deferredEnd) {
      return deferredEnd.promise
    }

    deferredEnd = deferred()

    if (!running) {
      if (aborted) {
        deferredEnd.reject(taskError)
      } else {
        deferredEnd.resolve(taskResult)
      }
    }

    return deferredEnd.promise
  }

  const task = {
    // fields
    [TASK]: true,
    id: parentEffectId,
    mainTask,
    meta,
    isRoot,
    context,
    joiners: [],
    queue,
    crashedEffect: null,

    // methods
    cancel,
    cont,
    end,
    setContext,
    toPromise,
    isRunning: () => running,
    isCancelled: () => cancelled,
    isAborted: () => aborted,
    result: () => taskResult,
    error: () => taskError,
  }

  return task
}
