import test from 'tape'
import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { retry } from '../../src/effects'

test('retry failing', assert => {
  assert.plan(2)

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
    } catch(e) {
        error = e
    }
  }

  function* fnToCall(arg1) {
    called++
    actual.push([arg1, called])
    throw new Error(errorMessage)
  }

    middleware.run(saga)
      .toPromise()
      .then(() => {
        assert.deepEqual(actual, expected, 'should retry only for the defined number of times')
        assert.equal(error.message, errorMessage, 'should rethrow Error if failed more than the defined number of times')
        assert.end()
      })
      .catch(err => assert.fail(err))
})

test('retry without failing', assert => {
    assert.plan(1)

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
  
    middleware.run(saga)
      .toPromise()
      .then(() => {
        assert.equal(result, returnedValue, 'should return a result of called function')
        assert.end()
      })
      .catch(err => assert.fail(err))
  })
  