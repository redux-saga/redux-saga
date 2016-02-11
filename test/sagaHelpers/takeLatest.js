/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape';
import sagaMiddleware, { takeLatest } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeffered } from '../../src/utils'


test('takeEvery', assert => {
  assert.plan(1)

  const defs = arrayOfDeffered(4)

  const actual = []
  const store = applyMiddleware(sagaMiddleware(watcher))(createStore)(() => {})

  function* worker(action) {
    const idx = action.payload - 1
    const response = yield defs[idx].promise
    actual.push(response)
  }

  function* watcher() {
    yield* takeLatest('ACTION', worker)
  }

  Promise.resolve(1)
  .then(() => store.dispatch({type: 'ACTION', payload: 1}) )
  .then(() => store.dispatch({type: 'ACTION', payload: 2}) )
  .then(() => defs[0].resolve('w-1') )
  .then(() => store.dispatch({type: 'ACTION', payload: 3}) )
  .then(() => defs[1].resolve('w-2') )
  .then(() => defs[2].resolve('w-3') )
  .then(() => store.dispatch({type: 'ACTION', payload: 4}) )
  .then(() => defs[3].resolve('w-4') )

  .then(() => {
    assert.deepEqual(actual, ['w-3', 'w-4'],
      "takeEvery must fork a worker on each action"
    );
  })
})
