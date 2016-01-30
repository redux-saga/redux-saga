import test from 'tape';
import proc, { NOT_ITERATOR_ERROR } from '../../src/proc'
import { is } from '../../src/utils'
import * as io from '../../src/io'

const DELAY = 50

test('processor iteration', assert => {
  assert.plan(4)

  let actual = []

  function* genFn() {
    actual.push( yield 1 )
    actual.push( yield 2 )
    return 3
  }

  const iterator = genFn()
  const endP = proc(iterator).done.catch(err => assert.fail(err))
  assert.equal(iterator._isRunning, false,
    'processor\'s iterator should have _isRunning = false'
  )
  assert.equal(is.promise(endP), true,
  'processor should return a promise of the iterator result'
  )
  endP.then((res) => {
    assert.equal(res, 3,
      'processor returned promise should resolve with the iterator return value'
    )
    assert.deepEqual(actual, [1,2],
      'processor should collect yielded values from the iterator'
    )
  })

})

/* TODO check that promise result is rejected when the generator throws an error */

test('processor input', assert => {
  assert.plan(1)

  try {
    proc({})
  } catch(error) {
    assert.equal(error.message, NOT_ITERATOR_ERROR,
      'processor must throw if not provided with an iterator'
    )
  }

  try {
    proc((function*() {})())
  } catch(error) {
    assert.fail("processor must not throw if provided with an iterable")
  }

  assert.end()

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
