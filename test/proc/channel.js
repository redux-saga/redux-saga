import test from 'tape';
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { buffers } from '../../src'
import * as io from '../../src/effects'

test('proc create channel for store actions', assert => {
  assert.plan(1);

  let actual = [];

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    const chan = yield io.actionChannel('action')
    for (var i = 0; i < 10; i++) {
      yield Promise.resolve(1)
      const {payload} = yield io.take(chan)
      actual.push(payload)
    }
  }

  const task = middleware.run(genFn)

  for (var i = 0; i < 10; i++) {
    store.dispatch({type: 'action', payload: i+1})
  }

  task.done
    .then(() => {
      assert.deepEqual(actual, [1,2,3,4,5,6,7,8,9,10],
        "processor must queue dispatched actions"
      );
      assert.end();
    })
    .catch(err => assert.fail(err))
});

test('proc create channel for store actions (with buffer)', assert => {
  assert.plan(1);

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  const buffer = buffers.expanding()

  function* genFn() {
    // TODO: this might mean that we do not close / flush channels when sagas ends
    // should we clean them up automatically? or is it user's responsibility?
    let chan = yield io.actionChannel('action', buffer)
    return chan
  }

  const task = middleware.run(genFn)

  Promise.resolve().then(() => {
    for (var i = 0; i < 10; i++) {
      store.dispatch({type: 'action', payload: i+1})
    }
  })

  task.done
    .then(() => {
      assert.deepEqual(buffer.flush().map(item => item.payload), [1,2,3,4,5,6,7,8,9,10],
        "processor must queue dispatched actions"
      );
      assert.end();
    })
    .catch(err => assert.fail(err))
});
