import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'
import { deferred } from '../../src/utils'

test('processor select/getState handling', assert => {
  assert.plan(1);

  let actual = [];

  const state = { counter: 0 }
  const counterSelector = s => s.counter

  const def = deferred()


  function* genFn() {
    actual.push( (yield io.getState()).counter )
    actual.push( yield io.select(counterSelector)  )

    yield def.promise

    actual.push( (yield io.getState()).counter  )
    actual.push( yield io.select(counterSelector)  )
  }

  proc(genFn(), undefined, undefined, () => state).done.catch(err => assert.fail(err))

  const expected = [0,0,1,1];



  Promise.resolve(1)
    .then(() => {
      def.resolve()
      state.counter++
    })
    .then(() => {
      assert.deepEqual(actual, expected, 'should resolve getState and select effects')
    })
    .then(assert.end)
});
