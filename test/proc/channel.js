import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'
//import { emitter } from '../../src/internal/channel'


test('proc create channel for store actions', assert => {
  assert.plan(1);

  let actual = [];
  let dispatch
  const input = (cb) => { dispatch = cb; return () => {} }


  function* genFn() {
    const chan = yield io.actionChannel('action')
    for (var i = 0; i < 10; i++) {
      yield Promise.resolve(1)
      const {payload} = yield io.take(chan)
      actual.push(payload)
    }
  }



  proc(genFn(), input).done.catch(err => assert.fail(err))

  for (var i = 0; i < 10; i++) {
    dispatch({type: 'action', payload: i+1})
  }

  setTimeout(() => {
    assert.deepEqual(actual, [1,2,3,4,5,6,7,8,9,10],
      "processor must queue dispatched actions"
    );
    assert.end();
  }, 0)

});

test('proc create channel for store actions (with buffer)', assert => {
  assert.plan(1);

  let dispatch
  const input = (cb) => { dispatch = cb; return () => {} }

  const buffer = []
  const spyBuffer = {
    isEmpty: () => !buffer.length,
    put: ({payload}) => buffer.push(payload),
    take: () => buffer.shift()
  }

  function* genFn() {
    let chan = yield io.actionChannel('action', spyBuffer)
    return chan
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  Promise.resolve().then(() => {
    for (var i = 0; i < 10; i++) {
      dispatch({type: 'action', payload: i+1})
    }
  })

  setTimeout(() => {
    assert.deepEqual(buffer, [1,2,3,4,5,6,7,8,9,10],
      "processor must queue dispatched actions"
    );
    assert.end();
  }, 0)

});
