import * as is from '@redux-saga/is'
import { SAGA_ACTION, TASK, TASK_CANCEL, TERMINATE } from '@redux-saga/symbols'

export const konst = v => () => v
export const kTrue = konst(true)
export const kFalse = konst(false)
export const noop = () => {}
export const identity = v => v

export function check(value, predicate, error) {
  if (!predicate(value)) {
    throw new Error(error)
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(object, property) {
  return is.notUndef(object) && hasOwnProperty.call(object, property)
}

export const object = {
  assign(target, source) {
    for (let i in source) {
      if (hasOwn(source, i)) {
        target[i] = source[i]
      }
    }
  },
}

export function remove(array, item) {
  const index = array.indexOf(item)
  if (index >= 0) {
    array.splice(index, 1)
  }
}

export const array = {
  from(obj) {
    const arr = Array(obj.length)
    for (let i in obj) {
      if (hasOwn(obj, i)) {
        arr[i] = obj[i]
      }
    }
    return arr
  },
}

export function once(fn) {
  let called = false
  return () => {
    if (called) {
      return
    }
    called = true
    fn()
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

    setRunning: b => (_isRunning = b),
    setResult: r => (_result = r),
    setError: e => (_error = e),
  }
}

export function autoInc(seed = 0) {
  return () => ++seed
}

export const uid = autoInc()

const kThrow = err => {
  throw err
}
const kReturn = value => ({ value, done: true })
export function makeIterator(next, thro = kThrow, name = 'iterator') {
  const iterator = { meta: { name }, next, throw: thro, return: kReturn, isSagaIterator: true }

  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = () => iterator
  }
  return iterator
}

/**
  Print error in a useful way whether in a browser environment
  (with expandable error stack traces), or in a node.js environment
  (text-only log output)
 **/
export function log(level, message, error = '') {
  /*eslint-disable no-console*/
  if (typeof window === 'undefined') {
    console.log(`redux-saga ${level}: ${message}\n${(error && error.stack) || error}`)
  } else {
    console[level](message, error)
  }
}

export function deprecate(fn, deprecationWarning) {
  return (...args) => {
    if (process.env.NODE_ENV === 'development') log('warn', deprecationWarning)
    return fn(...args)
  }
}

export const internalErr = err =>
  new Error(
    `
  redux-saga: Error checking hooks detected an inconsistent state. This is likely a bug
  in redux-saga code and not yours. Thanks for reporting this in the project's github repo.
  Error: ${err}
`,
  )

export const createSetContextWarning = (ctx, props) =>
  `${ctx ? ctx + '.' : ''}setContext(props): argument ${props} is not a plain object`

export const wrapSagaDispatch = dispatch => action =>
  dispatch(Object.defineProperty(action, SAGA_ACTION, { value: true }))

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

export const shouldTerminate = res => res === TERMINATE
export const shouldCancel = res => res === TASK_CANCEL
export const shouldComplete = res => shouldTerminate(res) || shouldCancel(res)

export function createAllStyleChildCallbacks(shape, parentCallback) {
  const keys = Object.keys(shape)
  const totalCount = keys.length

  if (process.env.NODE_ENV === 'development') {
    check(totalCount, c => c > 0, 'createAllStyleChildCallbacks: get an empty array or object')
  }

  let completedCount = 0
  let completed
  const results = {}
  const childCallbacks = {}

  function checkEnd() {
    if (completedCount === totalCount) {
      completed = true
      if (is.array(shape)) {
        parentCallback(array.from({ ...results, length: totalCount }))
      } else {
        parentCallback(results)
      }
    }
  }

  keys.forEach(key => {
    const chCbAtKey = (res, isErr) => {
      if (completed) {
        return
      }
      if (isErr || shouldComplete(res)) {
        parentCallback.cancel()
        parentCallback(res, isErr)
      } else {
        results[key] = res
        completedCount++
        checkEnd()
      }
    }
    chCbAtKey.cancel = noop
    childCallbacks[key] = chCbAtKey
  })

  parentCallback.cancel = () => {
    if (!completed) {
      completed = true
      keys.forEach(key => childCallbacks[key].cancel())
    }
  }

  return childCallbacks
}
