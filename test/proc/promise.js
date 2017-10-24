import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'

test('proc native promise handling', assert => {
  assert.plan(1)

  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    try {
      actual.push(yield Promise.resolve(1))
      actual.push(yield Promise.reject('error'))
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const task = middleware.run(genFn)

  task.done
    .then(() => {
      assert.deepEqual(actual, [1, 'caught error'], 'proc should handle promise resolveed/rejecetd values')
    })
    .catch(err => assert.fail(err))
})

test('proc native promise handling: undefined errors', assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    try {
      actual.push(yield Promise.reject())
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const task = middleware.run(genFn)

  task.done
    .then(() => {
      assert.deepEqual(actual, ['caught undefined'], 'proc should throw if Promise rejected with an undefined error')
    })
    .catch(err => assert.fail(err))
})
