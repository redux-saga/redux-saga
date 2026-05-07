import { cloneableGenerator } from '../src'

test('it should allow to "clone" the generator', () => {
  const genFunc = function* (num1, num2) {
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

test('it should clone generators after a thrown error is handled', () => {
  const error = new Error('boom')
  const genFunc = function* () {
    try {
      yield 'start'
    } catch (err) {
      const recovery = yield `caught ${err.message}`

      if (recovery) {
        yield 'recovered'
      } else {
        yield 'not recovered'
      }
    }
  }

  const cloneableGen = cloneableGenerator(genFunc)()
  expect(cloneableGen.next()).toEqual({
    value: 'start',
    done: false,
  })
  expect(cloneableGen.throw(error)).toEqual({
    value: 'caught boom',
    done: false,
  })

  const clone = cloneableGen.clone()

  expect(cloneableGen.next(true)).toEqual({
    value: 'recovered',
    done: false,
  })
  expect(clone.next(false)).toEqual({
    value: 'not recovered',
    done: false,
  })
})

test('it should clone generators after return jumps to a finally block', () => {
  const genFunc = function* () {
    try {
      yield 'start'
      yield 'unreachable after return'
    } finally {
      const shouldCleanup = yield 'cleanup'

      if (shouldCleanup) {
        yield 'cleaned'
      } else {
        yield 'skipped cleanup'
      }
    }
  }

  const cloneableGen = cloneableGenerator(genFunc)()
  expect(cloneableGen.next()).toEqual({
    value: 'start',
    done: false,
  })
  expect(cloneableGen.return()).toEqual({
    value: 'cleanup',
    done: false,
  })

  const clone = cloneableGen.clone()

  expect(cloneableGen.next(true)).toEqual({
    value: 'cleaned',
    done: false,
  })
  expect(clone.next(false)).toEqual({
    value: 'skipped cleanup',
    done: false,
  })
})
