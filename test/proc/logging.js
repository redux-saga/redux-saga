import test from 'tape';
import proc from '../../src/internal/proc'
import { noop } from '../../src/utils'
import * as io from '../../src/effects'

test('proc logging', assert => {
  assert.plan(2)

  let actual

  function* child() {
    throw new Error('child error')
  }

  function* main() {
    yield io.call(child)
  }

  proc(main(), undefined, noop, noop, {
    logger: (level, ...args) => {
      actual = [level, args.join(' ')]
    }
  }).done.catch(
    err => {
      assert.equal(actual[0], 'error', 'proc must log using provided logger')
      assert.ok(actual[1].indexOf(err.message) >= 0, 'proc must log using provided logger')
    }
  )
});
