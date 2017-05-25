import test from 'tape'
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'
import { noop } from '../../src/utils'

test('processor must handle context in dynamic scoping manner', assert => {
  assert.plan(1)

  let actual = []
  const input = () => {
    return () => {}
  }

  function* genFn() {
    actual.push(yield io.getContext('a'))
    yield io.setContext({ b: 2 })
    yield io.fork(function*() {
      actual.push(yield io.getContext('a'))
      actual.push(yield io.getContext('b'))
      yield io.setContext({ c: 3 })
      actual.push(yield io.getContext('c'))
    })
    actual.push(yield io.getContext('c'))
  }

  const context = { a: 1 }
  proc(genFn(), input, noop, noop, context).done.catch(err => assert.fail(err))

  const expected = [1, 1, 2, 3, undefined]

  setTimeout(() => {
    assert.deepEqual(actual, expected, 'processor must handle context in dynamic scoping manner')
    assert.end()
  }, 0)
})
