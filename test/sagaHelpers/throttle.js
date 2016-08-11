import test from 'tape';
import sagaMiddleware, { throttle } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeffered } from '../../src/utils'
import { delay } from '../../src'
import { take, fork, cancel } from '../../src/effects'

test('throttle', assert => {
  assert.plan(1)

  const defs = arrayOfDeffered(5)

  const actual = []
  const expected = [
    ['a1', 'a2', 'w-1'],
    ['a1', 'a2', 'w-2'],
    ['a1', 'a2', 'w-4']
  ]
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    const task = yield fork(watcher)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(arg1, arg2, { payload }) {
    const response = yield defs[Math.floor(payload / 10)].promise
    actual.push([arg1, arg2, response])
  }

  function* watcher() {
    yield throttle(100, 'ACTION', worker, 'a1', 'a2')
  }

  const dispatchedActions = []
  for (let i = 0; i < 35; i++) {
    dispatchedActions.push(
      delay(i * 10, i).then(val => store.dispatch({type: 'ACTION', payload: val}))
    )
  }

  Promise.all(dispatchedActions)
  .then(() => defs[0].resolve('w-1') )
  .then(() => defs[1].resolve('w-2') )
  // wait so traling dispatch gets processed
  .then(() => delay(60))
  // skip defs[2] so cancelation process may get tested
  .then(() => defs[3].resolve('w-4') )
  .then(() => store.dispatch({type: 'CANCEL_WATCHER'}))
  // shouldn't be processed cause of geting canceled
  .then(() => defs[2].resolve('w-3') )
  // should be ignored by the watcher
  .then(() => store.dispatch({type: 'ACTION', payload: 40}) )
  .then(() => defs[4].resolve('w-5') )
  .then(() => {
    assert.deepEqual(actual, expected, 'throttle must ignore incoming actions during throttling interval')
  })
  .catch(err => assert.fail(err))
})
