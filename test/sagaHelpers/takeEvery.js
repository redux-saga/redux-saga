/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape';
import sagaMiddleware, { takeEvery } from '../../src'
import { createStore, applyMiddleware } from 'redux'


test('takeEvery', assert => {
  assert.plan(1)

  const actual = []
  const store = applyMiddleware(sagaMiddleware(watcher))(createStore)(() => {})

  function* worker(action) {
    actual.push(action.payload)
  }

  function* watcher() {
    yield* takeEvery('ACTION', worker)
  }

  Promise.resolve(1)
  .then(() => {
    store.dispatch({type: 'ACTION', payload: 1})
    store.dispatch({type: 'ACTION', payload: 2})
    store.dispatch({type: 'ACTION', payload: 3})
  })
  .then(() => {
    assert.deepEqual(actual, [1,2,3],
      "takeEvery must fork a worker on each action"
    );
  })
})
