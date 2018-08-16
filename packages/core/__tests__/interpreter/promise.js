import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
test('saga native promise handling', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    try {
      actual.push(yield Promise.resolve(1))
      actual.push(yield Promise.reject('error'))
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const task = middleware.run(genFn)
  return task.toPromise().then(() => {
    // saga should handle promise resolved/rejected values
    expect(actual).toEqual([1, 'caught error'])
  })
})
test('saga native promise handling: undefined errors', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    try {
      actual.push(yield Promise.reject())
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const task = middleware.run(genFn)
  return task.toPromise().then(() => {
    // saga should throw if Promise rejected with an undefined error
    expect(actual).toEqual(['caught undefined'])
  })
})
