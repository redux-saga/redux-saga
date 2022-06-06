import { TASK } from '@redux-saga/symbols'
import { RUNNING, CANCELLED, ABORTED, DONE } from '@redux-saga/core/src/internal/task-status'

export const cloneableGenerator = generatorFunc => (...args) => {
  const history = []
  const gen = generatorFunc(...args)
  return {
    next: arg => {
      history.push(arg)
      return gen.next(arg)
    },
    clone: () => {
      const clonedGen = cloneableGenerator(generatorFunc)(...args)
      history.forEach(arg => clonedGen.next(arg))
      return clonedGen
    },
    return: value => gen.return(value),
    throw: exception => gen.throw(exception),
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
    cancel: () => {},
    joiners: [],

    setRunning: () => (status = RUNNING),
    setResult: r => {
      taskResult = r
      status = DONE
    },
    setError: e => {
      taskError = e
      status = ABORTED
    },
    setIsAborted: () => {
      status = ABORTED
    },
  }
}
