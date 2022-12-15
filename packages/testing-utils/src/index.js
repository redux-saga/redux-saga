import { TASK } from '@redux-saga/symbols'

// Keep in sync with @redux-saga/core/src/internal/task-status
const RUNNING = 0
const CANCELLED = 1
const ABORTED = 2
const DONE = 3

const statusToStringMap = {
  [RUNNING]: 'Running',
  [CANCELLED]: 'Cancelled',
  [ABORTED]: 'Aborted',
  [DONE]: 'Done',
}

export const cloneableGenerator =
  (generatorFunc) =>
  (...args) => {
    const history = []
    const gen = generatorFunc(...args)
    return {
      next: (arg) => {
        history.push(arg)
        return gen.next(arg)
      },
      clone: () => {
        const clonedGen = cloneableGenerator(generatorFunc)(...args)
        history.forEach((arg) => clonedGen.next(arg))
        return clonedGen
      },
      return: (value) => gen.return(value),
      throw: (exception) => gen.throw(exception),
    }
  }

const assertStatusRunning = (status) => {
  if (status !== RUNNING) {
    const str = statusToStringMap[status]
    throw new Error(
      `The task is no longer Running, it is ${str}. You can't change the status of a task once it is no longer running.`,
    )
  }
}

export function createMockTask() {
  let status = RUNNING
  let taskResult
  let taskError

  return {
    [TASK]: true,
    isRunning: () => status === RUNNING,
    isCancelled: () => status === CANCELLED,
    isAborted: () => status === ABORTED,
    result: () => taskResult,
    error: () => taskError,
    cancel: () => {
      assertStatusRunning(status)
      status = CANCELLED
    },
    joiners: [],

    /**
     * @deprecated Use `setResult`, `setError`, or `cancel` to change the
     * running status of the mock task.
     */
    setRunning: () => {
      // eslint-disable-next-line no-console
      console.warn(
        'setRunning has been deprecated. It no longer has any effect when being called. ' +
          'If you were calling setResult or setError followed by setRunning, those methods now change the ' +
          'running status of the task. Simply remove the call to setRunning for the desired behavior.',
      )
    },
    setResult: (r) => {
      assertStatusRunning(status)
      taskResult = r
      status = DONE
    },
    setError: (e) => {
      assertStatusRunning(status)
      taskError = e
      status = ABORTED
    },
  }
}
