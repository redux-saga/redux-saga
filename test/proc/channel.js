import test from 'tape';
import proc from '../../src/internal/proc'
import { channel, END } from '../../src/internal/channel'
import * as io from '../../src/effects'



test('proc queue store actions', assert => {
  assert.plan(1);

  let actual = [];
  let dispatch
  const input = (cb) => dispatch = cb


  function* genFn() {
    const chan = yield io.channel('action')
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

test('processor take from provided channel', assert => {
  assert.plan(1);

  const chan = channel()
  let actual = [];

  Promise.resolve()
    .then(() => chan.put(1))
    .then(() => chan.put(2))
    .then(() => chan.put(3))
    .then(() => chan.put(4))
    .then(() => chan.close())


  function* genFn() {
    actual.push( yield io.take(chan, ev => ev === 1) )
    actual.push( yield io.take(chan) )
    actual.push( yield io.take(chan) )
    actual.push( yield io.take(chan, ev => ev !== 4) )
    actual.push( yield io.take(chan) )
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = [1, 2, 3, END, END];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill take Effects from a provided channel"
    );
    assert.end();
  }, 0)

});
