import _extends from '@babel/runtime/helpers/extends'
import * as is from '@redux-saga/is'
import { SAGA_LOCATION, SAGA_ACTION, TASK_CANCEL, TERMINATE } from '@redux-saga/symbols'

export const konst = v => () => v
export const kTrue = konst(true)
export const kFalse = konst(false)
export const noop = () => {}
export const identity = v => v

const hasSymbol = typeof Symbol === 'function'
export const asyncIteratorSymbol = hasSymbol && Symbol.asyncIterator ? Symbol.asyncIterator : '@@asyncIterator'

export function check(value, predicate, error) {
  if (!predicate(value)) {
    throw new Error(error)
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(object, property) {
  return is.notUndef(object) && hasOwnProperty.call(object, property)
}

export const assignWithSymbols = (target, source) => {
  _extends(target, source)

  if (Object.getOwnPropertySymbols) {
    Object.getOwnPropertySymbols(source).forEach(s => {
      target[s] = source[s]
    })
  }
}

export const flatMap = (mapper, arr) => [].concat(...arr.map(mapper))

export function remove(array, item) {
  const index = array.indexOf(item)
  if (index >= 0) {
    array.splice(index, 1)
  }
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

export function logError(error, { sagaStack }) {
  /*eslint-disable no-console*/
  console.error(error)
  console.error(sagaStack)
}

export function deprecate(fn, deprecationWarning) {
  return (...args) => {
    if (process.env.NODE_ENV !== 'production') console.warn(deprecationWarning)
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

const FROZEN_ACTION_ERROR = `You can't put (a.k.a. dispatch from saga) frozen actions.
We have to define a special non-enumerable property on those actions for scheduling purposes.
Otherwise you wouldn't be able to communicate properly between sagas & other subscribers (action ordering would become far less predictable).
If you are using redux and you care about this behaviour (frozen actions),
then you might want to switch to freezing actions in a middleware rather than in action creator.
Example implementation:

const freezeActions = store => next => action => next(Object.freeze(action))
`

// creates empty, but not-holey array
export const createEmptyArray = n => Array.apply(null, new Array(n))

export const wrapSagaDispatch = dispatch => action => {
  if (process.env.NODE_ENV !== 'production') {
    check(action, ac => !Object.isFrozen(ac), FROZEN_ACTION_ERROR)
  }
  return dispatch(Object.defineProperty(action, SAGA_ACTION, { value: true }))
}

export const shouldTerminate = res => res === TERMINATE
export const shouldCancel = res => res === TASK_CANCEL
export const shouldComplete = res => shouldTerminate(res) || shouldCancel(res)

export function createAllStyleChildCallbacks(shape, parentCallback) {
  const keys = Object.keys(shape)
  const totalCount = keys.length

  if (process.env.NODE_ENV !== 'production') {
    check(totalCount, c => c > 0, 'createAllStyleChildCallbacks: get an empty array or object')
  }

  let completedCount = 0
  let completed
  const results = is.array(shape) ? createEmptyArray(totalCount) : {}
  const childCallbacks = {}

  function checkEnd() {
    if (completedCount === totalCount) {
      completed = true
      parentCallback(results)
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

export function getMetaInfo(fn) {
  return {
    name: fn.name || 'anonymous',
    location: getLocation(fn),
  }
}

export function getLocation(instrumented) {
  return instrumented[SAGA_LOCATION]
}
