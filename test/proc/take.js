import test from 'tape';
import proc from '../../src/proc'
import * as io from '../../src/io'

const DELAY = 50
const delay = (ms) => () => new Promise(resolve => setTimeout(resolve, ms))

test('processor take handling', assert => {
  assert.plan(1);

  let actual = [];
  const input = (cb) => {
    Promise.resolve(1)
      .then(() => cb({type: 'action-*'}))
      .then(delay(0))
      .then(() => cb({type: 'action-1'}))
      .then(delay(0))
      .then(() => cb({type: 'action-2'}))
      .then(delay(0))
      .then(() => cb({isAction: true}))
      .then(delay(0))
      .then(() => cb({type: 'action-3'}))
    return () => {}
  }

  function* genFn() {
    actual.push( yield io.take('action-*') )
    actual.push( yield io.take('action-1') )
    actual.push( yield io.take('action-2', 'action-2222') )
    actual.push( yield io.take(a => a.isAction) )
    actual.push( yield io.take('action-2222') )
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [{type: 'action-*'}, {type: 'action-1'}, {type: 'action-2'}, {isAction: true}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill input queries from the generator"
    );
    assert.end();
  }, DELAY)

});
