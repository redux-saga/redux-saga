import { TASK } from '@redux-saga/symbols'

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
  let _isRunning = true
  let _result
  let _error

  return {
    [TASK]: true,
    isRunning: () => _isRunning,
    result: () => _result,
    error: () => _error,
    cancel: () => {},

    setRunning: b => (_isRunning = b),
    setResult: r => (_result = r),
    setError: e => (_error = e),
  }
}
