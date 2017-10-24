import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('proc logging', assert => {
  assert.plan(2)

  let actual
  const middleware = sagaMiddleware({
    logger: (level, ...args) => {
      actual = [level, args.join(' ')]
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    throw new Error('child error')
  }

  function* main() {
    yield io.call(child)
  }

  const task = middleware.run(main)

  task.done.catch(err => {
    assert.equal(actual[0], 'error', 'proc must log using provided logger')
    assert.ok(actual[1].indexOf(err.message) >= 0, 'proc must log using provided logger')
  })
})
