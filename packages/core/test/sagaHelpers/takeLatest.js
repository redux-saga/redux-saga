import test from 'tape'
import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeferred } from '../../src/utils'
import { take, cancel, takeLatest } from '../../src/effects'

test('takeLatest', assert => {
  assert.plan(1)

  const defs = arrayOfDeferred(4)

  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    const task = yield takeLatest('ACTION', worker, 'a1', 'a2')
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(arg1, arg2, action) {
    const idx = action.payload - 1
    const response = yield defs[idx].promise
    actual.push([arg1, arg2, response])
  }

  Promise.resolve(1)
    .then(() => store.dispatch({ type: 'ACTION', payload: 1 }))
    .then(() => store.dispatch({ type: 'ACTION', payload: 2 }))
    .then(() => defs[0].resolve('w-1'))
    .then(() => store.dispatch({ type: 'ACTION', payload: 3 }))
    .then(() => defs[1].resolve('w-2'))
    .then(() => defs[2].resolve('w-3'))
    .then(() => {
      store.dispatch({ type: 'ACTION', payload: 4 })
      /*
      We immediately cancel the watcher after firing the action
      The watcher should be canceleld after this
      no further task should be forked
      the last forked task should also be cancelled
    */
      store.dispatch({ type: 'CANCEL_WATCHER' })
    })
    .then(() => defs[3].resolve('w-4'))
    .then(() => {
      // this one should be ignored by the watcher
      store.dispatch({ type: 'ACTION', payload: 5 })
    })
    .then(() => {
      assert.deepEqual(actual, [['a1', 'a2', 'w-3']], 'takeLatest must cancel current task before forking a new task')
    })
    .catch(err => assert.fail(err))
})
