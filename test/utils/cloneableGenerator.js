import test from 'tape'
import { cloneableGenerator } from '../../src/internal/utils'

test('it should allow to "clone" the generator', assert => {
  const genFunc = function*(num1, num2) {
    yield num1 * num2
    const num3 = yield
    const add = num1 + num2

    if (num3 > add) {
      yield num3 - add
    } else if (num3 === add) {
      yield 'you win'
    } else {
      yield add - num3
    }
  }

  const cloneableGen = cloneableGenerator(genFunc)(2, 3)

  assert.deepEqual(cloneableGen.next(), {
    value: 6,
    done: false,
  })

  assert.deepEqual(cloneableGen.next(), {
    value: undefined,
    done: false,
  })

  const cloneElseIf = cloneableGen.clone()
  const cloneElse = cloneElseIf.clone()

  assert.deepEqual(cloneableGen.next(13), {
    value: 8,
    done: false,
  })

  assert.deepEqual(cloneableGen.next(), {
    value: undefined,
    done: true,
  })

  assert.deepEqual(cloneElseIf.next(5), {
    value: 'you win',
    done: false,
  })
  assert.deepEqual(cloneElseIf.next(), {
    value: undefined,
    done: true,
  })

  assert.deepEqual(cloneElse.next(2), {
    value: 3,
    done: false,
  })

  const cloneReturn = cloneElse.clone()
  const cloneThrow = cloneElse.clone()

  assert.deepEqual(cloneElse.next(), {
    value: undefined,
    done: true,
  })

  assert.deepEqual(cloneReturn.return('toto'), {
    value: 'toto',
    done: true,
  })

  assert.throws(() => cloneThrow.throw('throws an exception'), 'throws an exception')

  assert.end()
})
