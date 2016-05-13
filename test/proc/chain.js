import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'

const DELAY = 50

test('processor handles chain effects', assert => {
  assert.plan(1);

  let actual = [];

  function plus1(value) {
    return Promise.resolve(value + 1);
  }

  function* times2(value) {
    return value * 2;
  }

  function* genFn() {
    actual.push( yield io.chain([plus1, times2], 1) );
  }

  proc(genFn()).done.catch(err => assert.fail(err));

  const expected = [4];

  setTimeout(() => {
    assert.deepEqual(actual, expected, "processor must fullfill declarative call effects");
    assert.end();
  }, DELAY)
});
