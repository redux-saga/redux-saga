import test from 'tape';
import proc, { NOT_ITERATOR_ERROR } from '../../src/internal/proc'
import { is } from '../../src/utils'
import * as io from '../../src/effects'

const DELAY = 50


test('proc input', assert => {
  assert.plan(1)

  try {
    proc({})
  } catch(error) {
    assert.equal(error.message, NOT_ITERATOR_ERROR,
      'proc must throw if not provided with an iterator'
    )
  }

  try {
    proc((function*() {})())
  } catch(error) {
    assert.fail("proc must not throw if provided with an iterable")
  }

  assert.end()

})

test('proc iteration', assert => {
  assert.plan(4)

  let actual = []

  function* genFn() {
    actual.push( yield 1 )
    actual.push( yield 2 )
    return 3
  }

  const iterator = genFn()
  const endP = proc(iterator).done.catch(err => assert.fail(err))
  assert.equal(is.promise(endP), true,
  'proc should return a promise of the iterator result'
  )

  endP.then((res) => {
    assert.equal(iterator._isRunning, false,
      'proc\'s iterator should have _isRunning = false'
    )
    assert.equal(res, 3,
      'proc returned promise should resolve with the iterator return value'
    )
    assert.deepEqual(actual, [1,2],
      'proc should collect yielded values from the iterator'
    )
  })

})

test('proc error handling', assert => {
  assert.plan(2)

  function fnThrow() {
    throw 'error'
  }

  /*
    throw
  */
  function* genThrow() {
    fnThrow()
  }

  proc(genThrow()).done.then(
    () => assert.fail('proc must return a rejected promise if generator throws an uncaught error'),
    err => assert.equal(err, 'error', 'proc must return a rejected promise if generator throws an uncaught error')
  )

  /*
    try + catch + finally
  */
  let actual = []
  function* genFinally() {
    try {
      fnThrow()
      actual.push('unerachable')
    } catch(error) {
      actual.push('caught-' + error)
    } finally {
      actual.push('finally')
    }

  }

  proc(genFinally()).done.then(
    () => assert.deepEqual(actual, ['caught-error', 'finally'], 'proc must route to catch/finally blocks in the generator'),
    () => assert.fail('proc must route to catch/finally blocks in the generator')
  )

})

test('processor output handling', assert => {
  assert.plan(1)

  let actual = []
  const dispatch = v => actual.push(v)

  function* genFn(arg) {
    yield io.put(arg)
    yield io.put(2)
  }

  proc(genFn('arg'), undefined, dispatch).done.catch(err => assert.fail(err))

  const expected = ['arg', 2];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must handle generator output"
    );
    assert.end();
  }, DELAY)

});
