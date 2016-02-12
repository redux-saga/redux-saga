/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape';
import sagaMiddleware, { takeLatest } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeffered } from '../../src/utils'
import { take, fork, cancel } from '../../src/effects'

test('takeLatest', assert => {
  assert.plan(1)

  const defs = arrayOfDeffered(4)

  const actual = []
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})

  function* root() {
    const task = yield fork(watcher)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

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
  .then(() => {
    store.dispatch({type: 'ACTION', payload: 4})
    /*
      We immediately cancel the watcher after firing the action
      The watcher should be canceleld after this
      no furhter task should be forked
      but the last forked task must keep running
    */
    store.dispatch({type: 'CANCEL_WATCHER'})
  })
  .then(() => defs[3].resolve('w-4') )
  .then(() => {
    // this one should be ignored by the watcher
    store.dispatch({type: 'ACTION', payload: 5})
  })

  .then(() => {
    assert.deepEqual(actual, ['w-3', 'w-4'],
      "takeLatest must cancel current task before forking a new task"
    );
  })
  .catch(err => assert.fail(err))
})
