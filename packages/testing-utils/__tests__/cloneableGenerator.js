import { cloneableGenerator } from '../src'

test('it should allow to "clone" the generator', () => {
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
  expect(cloneableGen.next()).toEqual({
    value: 6,
    done: false,
  })
  expect(cloneableGen.next()).toEqual({
    value: undefined,
    done: false,
  })
  const cloneElseIf = cloneableGen.clone()
  const cloneElse = cloneElseIf.clone()
  expect(cloneableGen.next(13)).toEqual({
    value: 8,
    done: false,
  })
  expect(cloneableGen.next()).toEqual({
    value: undefined,
    done: true,
  })
  expect(cloneElseIf.next(5)).toEqual({
    value: 'you win',
    done: false,
  })
  expect(cloneElseIf.next()).toEqual({
    value: undefined,
    done: true,
  })
  expect(cloneElse.next(2)).toEqual({
    value: 3,
    done: false,
  })
  const cloneReturn = cloneElse.clone()
  const cloneThrow = cloneElse.clone()
  expect(cloneElse.next()).toEqual({
    value: undefined,
    done: true,
  })
  expect(cloneReturn.return('toto')).toEqual({
    value: 'toto',
    done: true,
  })
  expect(() => cloneThrow.throw('throws an exception')).toThrow()
})
