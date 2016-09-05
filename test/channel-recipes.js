/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../src'
import { take, put, fork, join, call, race, cancel, actionChannel } from '../src/effects'
import {channel, buffers, END} from '../src'

test('action channel', assert => {
  assert.plan(1);

  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* saga() {
    const chan = yield actionChannel('ACTION')
    while(true) {
      const {payload} = yield take(chan)
      actual.push(payload)
      yield Promise.resolve() // block
    }
  }

  middleware.run(saga).done.then(() => {
    assert.deepEqual(actual, [1,2,3],
      "Sagas must take consecutive actions dispatched synchronously on an action channel even if it performs blocking calls"
    );
    assert.end();
  }).catch(err => assert.fail(err))

  for (var i = 0; i < 3; i++) {
    store.dispatch({type: 'ACTION', payload: i+1})
  }
  store.dispatch(END)

});

test('channel: watcher + max workers', assert => {
  assert.plan(1);

  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* saga() {
    const chan = channel()
    try {
      for (var i = 0; i < 3; i++) {
        yield fork(worker, i+1, chan)
      }
      while(true) {
        const {payload} = yield take('ACTION')
        yield put(chan, payload)
      }
    } finally {
      chan.close()
    }
  }

  function* worker(idx, chan) {
    let count = 0
    while(true) {
      actual.push( [idx, yield take(chan)] )
      // 1st worker will 'sleep' after taking 2 messages on the 1st round
      if(idx === 1 && (++count) === 2) {
        yield Promise.resolve()
      }
    }
  }

  middleware.run(saga).done.then(() => {
    assert.deepEqual(actual, [ [1,1], [2,2], [3,3], [1,4], [2,5], [3,6], [2,7], [3,8], [2,9], [3,10]],
      "Saga must dispatch to free workers via channel"
    );
    assert.end();
  })

  for (var i = 0; i < 10; i++) {
    store.dispatch({type: 'ACTION', payload: i+1, round: 1})
  }

  store.dispatch(END)

});
