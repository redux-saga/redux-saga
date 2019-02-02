import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('should not interpret returned effect. fork(() => effectCreator())', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const fn = () => null

  function* genFn() {
    const task = yield io.fork(() => io.call(fn))
    return task.toPromise()
  }

  return middleware
    .run(genFn)
    .toPromise()
    .then(actual => {
      expect(actual).toEqual(io.call(fn))
    })
})

test("should not interpret returned effect. yield fork(takeEvery, 'pattern', fn)", () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const fn = () => null

  function* genFn() {
    const task = yield io.fork(io.takeEvery, 'pattern', fn)
    return task.toPromise()
  }

  return middleware
    .run(genFn)
    .toPromise()
    .then(actual => {
      expect(actual).toEqual(io.takeEvery('pattern', fn))
    })
})

test('should interpret returned promise. fork(() => promise)', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    const task = yield io.fork(() => Promise.resolve('a'))
    return task.toPromise()
  }

  return middleware
    .run(genFn)
    .toPromise()
    .then(actual => {
      expect(actual).toEqual('a')
    })
})

test('should handle promise that resolves undefined properly. fork(() => Promise.resolve(undefined))', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    const task = yield io.fork(() => Promise.resolve(undefined))
    return task.toPromise()
  }

  return middleware
    .run(genFn)
    .toPromise()
    .then(actual => {
      expect(actual).toEqual(undefined)
    })
})

test('should interpret returned iterator. fork(() => iterator)', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    const task = yield io.fork(function*() {
      yield 1
      return 'b'
    })
    return task.toPromise()
  }

  return middleware
    .run(genFn)
    .toPromise()
    .then(actual => {
      expect(actual).toEqual('b')
    })
})
