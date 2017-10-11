import test from 'tape'
import lolex from 'lolex'
import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { take, retry } from '../../src/effects'

test('retry fails', assert => {
  const clock = lolex.install()
  assert.plan(1)

  let called = 0
  const delayMs = 100
  const actual = []
  const expected = [['a', 1], ['a', 2], ['a', 3]]
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    yield take('START')
    yield retry(3, delayMs, worker, 'a')
  }

  function* worker(arg1) {
    called++
    actual.push([arg1, called])
    throw new Error('worker failed')
  }

  Promise.resolve(1)
    .then(() => store.dispatch({ type: 'START' }))
    .then(() => clock.tick(delayMs))
    .then(() => clock.tick(delayMs))
    .then(() => clock.tick(delayMs))
    .then(() => {
      assert.deepEqual(actual, expected, 'it should retry only for the defined amount of times')
    })
    .then(() => clock.uninstall())
})
