import test from 'tape';
import proc from '../../src/internal/proc'
import { noop } from '../../src/utils'
import * as io from '../../src/effects'

test('proc onerror', assert => {
  assert.plan(1)

  const expectedError = new Error('child error')

  let actual

  function* child() {
    throw expectedError
  }

  function* main() {
    yield io.call(child)
  }

  proc(main(), undefined, noop, noop, {
    onerror: (err) => {
      actual = err
    }
  }).done.catch(
    err => {
      assert.equal(actual, expectedError, 'proc must call onerror handler')
    }
  )
})

test('proc no onerror', assert => {
  assert.plan(1)

  const expectedError = new Error('child error')

  function* child() {
    throw expectedError
  }

  function* main() {
    yield io.call(child)
  }

  proc(main(), undefined, noop, noop, {
  }).done.catch(
    err => {
      assert.equal(err, expectedError, 'proc does not blow up without onerror')
    }
  )
})
