import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('proc onError is optional', assert => {
  assert.plan(1)

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  const expectedError = new Error('child error')

  function* child() {
    throw expectedError
  }

  function* main() {
    yield io.call(child)
  }

  const task = middleware.run(main)

  task.done.catch(err => {
    assert.equal(err, expectedError, 'proc does not blow up without onError')
  })
})

test('proc onError is called for uncaught error', assert => {
  assert.plan(1)

  const middleware = sagaMiddleware({
    onError: err => {
      actual = err
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  const expectedError = new Error('child error')

  let actual

  function* child() {
    throw expectedError
  }

  function* main() {
    yield io.call(child)
  }

  const task = middleware.run(main)

  task.done.catch(() => {
    assert.equal(actual, expectedError, 'proc must call onError handler')
  })
})

test('proc onError is not called for caught errors', assert => {
  assert.plan(2)

  const expectedError = new Error('child error')

  let actual
  let caught

  const middleware = sagaMiddleware({
    onError: err => {
      actual = err
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    throw expectedError
  }

  function* main() {
    try {
      yield io.call(child)
    } catch (err) {
      caught = err
    }
  }

  const task = middleware.run(main)

  task.done.then(() => {
    assert.equal(actual, undefined, 'proc must not call onError')
    assert.equal(caught, expectedError, 'parent must catch error')
  })
})
