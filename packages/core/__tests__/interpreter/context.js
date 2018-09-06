import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
test('saga must handle context in dynamic scoping manner', () => {
  let actual = []
  const context = {
    a: 1,
  }
  const middleware = sagaMiddleware({
    context,
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual.push(yield io.getContext('a'))
    yield io.setContext({
      b: 2,
    })
    yield io.fork(function*() {
      actual.push(yield io.getContext('a'))
      actual.push(yield io.getContext('b'))
      yield io.setContext({
        c: 3,
      })
      actual.push(yield io.getContext('c'))
    })
    actual.push(yield io.getContext('c'))
  }

  const task = middleware.run(genFn)
  const expected = [1, 1, 2, 3, undefined]
  return task.toPromise().then(() => {
    // saga must handle context in dynamic scoping manner
    expect(actual).toEqual(expected)
  })
})

test('saga must handle Symbol as valid context key', () => {
  let actual = []
  const a = Symbol('a')
  const b = Symbol('b')
  const context = { [a]: 1 }
  const middleware = sagaMiddleware({ context })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual.push(yield io.getContext(a))
    yield io.fork(function*() {
      yield io.setContext({ [b]: 2 })
      actual.push(yield io.getContext(a))
      actual.push(yield io.getContext(b))
    })
    actual.push(yield io.getContext(b))
  }

  const task = middleware.run(genFn)

  const expected = [1, 1, 2, undefined]

  return task
    .toPromise()
    .then(() => {
      expect(actual).toEqual(expected)
    })
})
