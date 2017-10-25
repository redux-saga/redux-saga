import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { is } from '../../src/utils'
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

test('proc iteration', assert => {
  assert.plan(4)

  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual.push(yield 1)
    actual.push(yield 2)
    return 3
  }

  const task = middleware.run(genFn)

  assert.equal(is.promise(task.done), true, 'proc should return a promise of the iterator result')

  task.done
    .then(res => {
      assert.equal(task.isRunning(), false, "proc's iterator should have _isRunning = false")
      assert.equal(res, 3, 'proc returned promise should resolve with the iterator return value')
      assert.deepEqual(actual, [1, 2], 'proc should collect yielded values from the iterator')
    })
    .catch(err => assert.fail(err))
})

test('proc error handling', assert => {
  assert.plan(2)

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function fnThrow() {
    throw new Error('error')
  }

  /*
    throw
  */
  function* genThrow() {
    fnThrow()
  }

  const task1 = middleware.run(genThrow)
  task1.done
    .then(() => {
      assert.fail('proc must return a rejected promise if generator throws an uncaught error')
    })
    .catch(err =>
      assert.equal(err.message, 'error', 'proc must return a rejected promise if generator throws an uncaught error'),
    )

  /*
    try + catch + finally
  */
  let actual = []
  function* genFinally() {
    try {
      fnThrow()
      actual.push('unerachable')
    } catch (error) {
      actual.push('caught-' + error.message)
    } finally {
      actual.push('finally')
    }
  }

  const task = middleware.run(genFinally)
  task.done
    .then(() => {
      assert.deepEqual(actual, ['caught-error', 'finally'], 'proc must route to catch/finally blocks in the generator')
    })
    .catch(() => assert.fail('proc must route to catch/finally blocks in the generator'))
})

test('processor output handling', assert => {
  assert.plan(1)

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
    yield io.put({ type: arg })
    yield io.put({ type: 2 })
  }

  const task = middleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task.done
    .then(() => {
      assert.deepEqual(actual, expected, 'processor must handle generator output')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('processor yielded falsy values', assert => {
  assert.plan(2)

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

  task.done
    .then(() => {
      assert.ok(isNaN(last(expected)))
      assert.deepEqual(dropRight(1, actual), dropRight(1, expected), 'processor must inject back yielded falsy values')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
