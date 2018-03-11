import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('saga cps call handling', assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    try {
      yield io.cps(cb => {
        actual.push('call 1')
        cb('err')
      })
      actual.push('call 2')
    } catch (err) {
      actual.push('call ' + err)
    }
  }

  const task = middleware.run(genFn)

  const expected = ['call 1', 'call err']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill cps call effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga synchronous cps failures handling', assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  let pastStoreCreation = false
  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }
    return {}
  }
  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function* genFnChild() {
    try {
      yield io.put({ type: 'startChild' })
      yield io.cps(() => {
        throw new Error('child error')
        //cb(null, "Ok")
      })
      yield io.put({ type: 'success child' })
    } catch (e) {
      yield io.put({ type: 'failure child' })
    }
  }

  function* genFnParent() {
    try {
      yield io.put({ type: 'start parent' })
      yield io.call(genFnChild)
      yield io.put({ type: 'success parent' })
    } catch (e) {
      yield io.put({ type: 'failure parent' })
    }
  }

  const task = middleware.run(genFnParent)

  const expected = ['start parent', 'startChild', 'failure child', 'success parent']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga should inject call error into generator')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga cps cancellation handling', assert => {
  assert.plan(1)

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  let cancelled = false
  const cpsFn = cb => {
    cb.cancel = () => {
      cancelled = true
    }
  }

  function* genFn() {
    const task = yield io.fork(function*() {
      yield io.cps(cpsFn)
    })
    yield io.cancel(task)
  }

  const task = middleware.run(genFn)

  task
    .toPromise()
    .then(() => {
      assert.true(cancelled, 'saga should call cancellation function on callback')
      assert.end()
    })
    .catch(err => {
      assert.fail(err)
      assert.done()
    })
})
