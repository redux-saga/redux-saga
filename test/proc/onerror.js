import test from 'tape';
import proc from '../../src/internal/proc'
import { noop } from '../../src/utils'
import * as io from '../../src/effects'

test('proc onError is optional', assert => {
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
      assert.equal(err, expectedError, 'proc does not blow up without onError')
    }
  )
})

test('proc onError is called for uncaught error', assert => {
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
    onError: (err) => {
      actual = err
    }
  }).done.catch(
    err => {
      assert.equal(actual, expectedError, 'proc must call onError handler')
    }
  )
})

test('proc onError is not called for caught errors', assert => {
  assert.plan(2)

  const expectedError = new Error('child error')

  let actual
  let caught

  function* child() {
    throw expectedError
  }

  function* main() {
    try {
      yield io.call(child)
    } catch (err) {
      caught = err
    }
  }

  proc(main(), undefined, noop, noop, {
    onError: (err) => {
      actual = err
    }
  }).done.then(() => {
    assert.equal(actual, undefined, 'proc must not call onError')
    assert.equal(caught, expectedError, 'parent must catch error')
  })
})
