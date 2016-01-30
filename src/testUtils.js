import { TASK } from './utils'

export function createMockTask() {

  let running = true
  let result, error

  return {
    [TASK]: true,
    isRunning: () => running,
    getResult: () => result,
    getError: () => error,

    setRunning : b => running = b,
    setResult  : r => result = r,
    setError   : e => error = e
  }

}
