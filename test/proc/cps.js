import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'

const DELAY = 50

test('processor cps call handling', assert => {
  assert.plan(1);

  let actual = [];

  function* genFn() {
    try {
      yield io.cps(cb => {
        actual.push('call 1');
        cb('err')
      })
      actual.push('call 2')
    } catch(err) {
      actual.push('call ' + err)
    }
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = ['call 1', 'call err'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill cps call effects"
    );
    assert.end();
  }, DELAY)

});
