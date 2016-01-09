import test from 'tape';
import proc from '../../src/proc'
import { deferred } from '../../src/utils'
import * as io from '../../src/io'

const DELAY = 50

test('processor race between effects handling', assert => {
  assert.plan(1);

  let actual = [];
  const timeout = deferred()
  const input = cb => {
    Promise.resolve(1)
      .then(() => timeout.resolve(1) )
      .then(() => cb({type: 'action'}))
    return () => {}
  }

  function* genFn() {
    actual.push( yield io.race({
      event: io.take('action'),
      timeout: timeout.promise
    }) )
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [{timeout: 1}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill race between effects"
    );
    assert.end();
  }, DELAY)

});
