import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { retry } from '../../src/effects'
test('retry failing', () => {
  let called = 0
  const delayMs = 0
  const errorMessage = 'failed'
  const actual = []
  const expected = [['a', 1], ['a', 2], ['a', 3]]
  let error
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* saga() {
    try {
      yield retry(3, delayMs, fnToCall, 'a')
    } catch (e) {
      error = e
    }
  }

  function* fnToCall(arg1) {
    called++
    actual.push([arg1, called])
    throw new Error(errorMessage)
  }

  return middleware
    .run(saga)
    .toPromise()
    .then(() => {
      // should retry only for the defined number of times
      expect(actual).toEqual(expected) // should rethrow Error if failed more than the defined number of times

      expect(error.message).toBe(errorMessage)
    })
})
test('retry without failing', () => {
  let called = false
  const delayMs = 0
  const returnedValue = 42
  let result
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* saga() {
    result = yield retry(3, delayMs, fnToCall)
  }

  function* fnToCall() {
    if (called === false) {
      called = true
      throw new Error()
    }

    return returnedValue
  }

  return middleware
    .run(saga)
    .toPromise()
    .then(() => {
      // should return a result of called function
      expect(result).toBe(returnedValue)
    })
})
