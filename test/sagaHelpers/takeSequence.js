import test from 'tape';
import sagaMiddleware, { takeSequence } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeffered } from '../../src/utils'
import { take, fork, cancel } from '../../src/effects'

test('takeSequence', assert => {
  assert.plan(1)

  const defs = arrayOfDeffered(4)
  let currentDef = 0

  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    const task = yield fork(watcher)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(arg1, arg2, action) {
    yield defs[currentDef++].promise
    actual.push([arg1, arg2, action.payload])
  }

  function* watcher() {
    yield* takeSequence('ACTION', worker, 'a1', 'a2')
  }

  Promise.resolve()
  .then(() => store.dispatch({type: 'ACTION', payload: 1}))
  .then(() => store.dispatch({type: 'ACTION', payload: 2})) // should be ignored
  .then(() => defs[0].resolve())
  .then(() => store.dispatch({type: 'ACTION', payload: 3}))
  .then(() => defs[1].resolve())
  .then(() => store.dispatch({type: 'ACTION', payload: 4}))
  .then(() => store.dispatch({type: 'ACTION', payload: 5})) // should be ignored
  .then(() => store.dispatch({type: 'ACTION', payload: 6})) // should be ignored
  .then(() => defs[2].resolve())
  .then(() => {
    store.dispatch({type: 'ACTION', payload: 4}) // should be ignored
    /*
      We immediately cancel the watcher after firing the action
      The watcher should be canceleld after this
      no furhter task should be forked
      the last forked task should also be cancelled
    */
    store.dispatch({type: 'CANCEL_WATCHER'})
  })
  .then(() => defs[3].resolve())
  .then(() => {
    assert.deepEqual(actual, [['a1', 'a2', 1], ['a1', 'a2', 3], ['a1', 'a2', 4]],
      "takeSequence must ignore actions if task for previous action already running"
    );
  })
  .catch(err => assert.fail(err))
})
