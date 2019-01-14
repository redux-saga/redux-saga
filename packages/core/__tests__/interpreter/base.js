import * as is from '@redux-saga/is'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

const last = arr => arr[arr.length - 1]

const dropRight = (n, arr) => {
  const copy = [...arr]

  while (n > 0) {
    copy.length = copy.length - 1
    n--
  }

  return copy
}

test('saga iteration', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual.push(yield 1)
    actual.push(yield 2)
    return 3
  }

  const task = middleware.run(genFn) // saga should return a promise of the iterator result

  expect(is.promise(task.toPromise())).toBe(true)
  return task.toPromise().then(res => {
    // saga's iterator should return false from isRunning()
    expect(task.isRunning()).toBe(false) // saga returned promise should resolve with the iterator return value

    expect(res).toBe(3) // saga should collect yielded values from the iterator

    expect(actual).toEqual([1, 2])
  })
})
test('saga error handling', () => {
  const middleware = sagaMiddleware({
    onError: err => {
      expect(err.message).toBe('test-error')
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function fnThrow() {
    throw new Error('test-error')
  }
  /*
    throw
  */

  function* genThrow() {
    fnThrow()
  }

  const task1 = middleware.run(genThrow)
  const promise1 = task1.toPromise().then(
    () => {
      throw new Error('saga must return a rejected promise if generator throws an uncaught error')
    },
    (
      err, // saga must return a rejected promise if generator throws an uncaught error
    ) => {
      expect(err.message).toBe('test-error')
    },
  )
  /*
    try + catch + finally
  */

  let actual = []

  function* genFinally() {
    try {
      fnThrow()
      actual.push('unreachable')
    } catch (error) {
      actual.push('caught-' + error.message)
    } finally {
      actual.push('finally')
    }
  }

  const task = middleware.run(genFinally)
  const promise2 = task.toPromise().then(() => {
    // saga must route to catch/finally blocks in the generator
    expect(actual).toEqual(['caught-test-error', 'finally'])
  })

  return Promise.all([promise1, promise2])
})
test('saga output handling', () => {
  let actual = []
  const middleware = sagaMiddleware()
  let pastStoreCreation = false

  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }

    return state
  }

  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function* genFn(arg) {
    yield io.put({
      type: arg,
    })
    yield io.put({
      type: 2,
    })
  }

  const task = middleware.run(genFn, 'arg')
  const expected = ['arg', 2]
  return task.toPromise().then(() => {
    // saga must handle generator output
    expect(actual).toEqual(expected)
  })
})
test('saga yielded falsy values', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual.push(yield false)
    actual.push(yield undefined)
    actual.push(yield null)
    actual.push(yield '')
    actual.push(yield 0)
    actual.push(yield NaN)
  }

  const task = middleware.run(genFn)
  const expected = [false, undefined, null, '', 0, NaN]
  return task.toPromise().then(() => {
    expect(isNaN(last(expected))).toBe(true) // saga must inject back yielded falsy values

    expect(dropRight(1, actual)).toEqual(dropRight(1, expected))
  })
})
