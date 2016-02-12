/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape';
import sagaMiddleware, { takeEvery } from '../../src'
import { take, fork, cancel } from '../../src/effects'
import { createStore, applyMiddleware } from 'redux'

const delay = ms => new Promise(r => setTimeout(r, ms))

test('takeEvery', assert => {
  assert.plan(1)

  const DELAY = 5
  const loop = 10

  const actual = []
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})

  function* root() {
    const task = yield  fork(watcher)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(action) {
    yield delay(DELAY)
    actual.push(action.payload)
  }

  function* watcher() {
    yield* takeEvery('ACTION', worker)
  }

  Promise.resolve(1)
  .then(() => {
    for(let i = 1; i <= loop/2; i++)
      store.dispatch({type: 'ACTION', payload: i})
  })
  // the watcher should be cancelled after this
  // no further task should be forked after this
  .then(() => store.dispatch({type: 'CANCEL_WATCHER'}) )
  .then(() => {
    for(let i = loop/2 + 1; i <= loop; i++)
      store.dispatch({type: 'ACTION', payload: i})
  })

  setTimeout(() => {
    assert.deepEqual(actual, [1,2,3,4,5],
      "takeEvery must fork a worker on each action"
    );
  }, DELAY * loop + 10)
})
