import deferred from '@redux-saga/deferred'
import * as is from '@redux-saga/is'
import { TASK, TASK_CANCEL } from '@redux-saga/symbols'
import { RUNNING, CANCELLED, ABORTED, DONE } from './task-status'
import { assignWithSymbols, check, createSetContextWarning } from './utils'
import forkQueue from './forkQueue'
import * as sagaError from './sagaError'

export default function newTask(env, mainTask, parentContext, parentEffectId, meta, isRoot, cont) {
  let status = RUNNING
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

   Cancellation propagates down to the whole execution tree held by this Parent task
   It's also propagated to all joiners of this task and their execution tree/joiners

   Cancellation is noop for terminated/Cancelled tasks tasks
   **/
  function cancel() {
    if (status === RUNNING) {
      // Setting status to CANCELLED does not necessarily mean that the task/iterators are stopped
      // effects in the iterator's finally block will still be executed
      status = CANCELLED
      queue.cancelAll()
      // Ending with a TASK_CANCEL will propagate the Cancellation to all joiners
      end(TASK_CANCEL)
    }
  }

  function end(result, isErr) {
    if (!isErr) {
      // The status here may be RUNNING or CANCELLED
      // If the status is CANCELLED, then we do not need to change it here
      if (status !== CANCELLED) {
        status = DONE
      }
      taskResult = result
      deferredEnd && deferredEnd.resolve(result)
    } else {
      status = ABORTED
      sagaError.addSagaFrame({ meta, cancelledTasks: cancelledDueToErrorTasks })

      if (task.isRoot) {
        const sagaStack = sagaError.toString()
        // we've dumped the saga stack to string and are passing it to user's code
        // we know that it won't be needed anymore and we need to clear it
        sagaError.clear()
        env.onError(result, { sagaStack })
      }
      taskError = result
      deferredEnd && deferredEnd.reject(result)
    }
    task.cont(result, isErr)
    task.joiners.forEach(joiner => {
      joiner.cb(result, isErr)
    })
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

    if (status === ABORTED) {
      deferredEnd.reject(taskError)
    } else if (status !== RUNNING) {
      deferredEnd.resolve(taskResult)
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
    isRunning: () => status === RUNNING,
    isCancelled: () => status === CANCELLED,
    isAborted: () => status === ABORTED,
    result: () => taskResult,
    error: () => taskError,
  }

  return task
}
