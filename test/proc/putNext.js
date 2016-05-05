import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'
import {noop} from '../../src/utils'

test('proc putNext handling', assert => {
  assert.plan(1)

  let actual = []
  const nextFn = v => actual.push(v)

  function* genFn(arg) {
    yield io.putNext(arg)
    yield io.putNext(2)
  }

  proc(genFn('arg'), undefined, noop, noop, nextFn).done.catch(err => assert.fail(err))

  const expected = ['arg', 2];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "proc must handle generator putNext(s)"
    );
    assert.end();
  });
});

