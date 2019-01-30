import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
test('saga handles call effects and resume with the resolved values', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  class C {
    constructor(val) {
      this.val = val
    }

    method() {
      return Promise.resolve(this.val)
    }
  }

  const inst1 = new C(1)
  const inst2 = new C(2)
  const inst3 = new C(3)
  const inst4 = new C(4)
  const inst5 = new C(5)
  const inst6 = new C(6)

  const eight = Symbol(8)

  function* subGen(io, arg) {
    yield Promise.resolve(null)
    return arg
  }

  function identity(arg) {
    return arg
  }

  function* genFn() {
    actual.push(yield io.call([inst1, inst1.method]))
    actual.push(yield io.call([inst2, 'method']))
    actual.push(yield io.apply(inst3, inst3.method))
    actual.push(yield io.apply(inst4, 'method'))
    actual.push(yield io.call({ context: inst5, fn: inst5.method }))
    actual.push(yield io.call({ context: inst6, fn: 'method' }))
    actual.push(yield io.call(subGen, io, 7))
    actual.push(yield io.call(identity, eight))
  }

  const task = middleware.run(genFn)
  const expected = [1, 2, 3, 4, 5, 6, 7, eight]
  return task.toPromise().then(() => {
    // saga must fulfill declarative call effects
    expect(actual).toEqual(expected)
  })
})
test('saga handles call effects and throw the rejected values inside the generator', () => {
  let actual = []
  let pastStoreCreation = false

  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }

    return {}
  }

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function fail(msg) {
    return Promise.reject(msg)
  }

  function* genFnParent() {
    try {
      yield io.put({
        type: 'start',
      })
      yield io.call(fail, 'failure')
      yield io.put({
        type: 'success',
      })
    } catch (e) {
      yield io.put({
        type: e,
      })
    }
  }

  const task = middleware.run(genFnParent)
  const expected = ['start', 'failure']
  return task.toPromise().then(() => {
    // saga dispatches appropriate actions
    expect(actual).toEqual(expected)
  })
})
test("saga handles call's synchronous failures and throws in the calling generator (1)", () => {
  let actual = []
  let pastStoreCreation = false

  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }

    return {}
  }

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function fail(message) {
    throw new Error(message)
  }

  function* genFnChild() {
    try {
      yield io.put({
        type: 'startChild',
      })
      yield io.call(fail, 'child error')
      yield io.put({
        type: 'success child',
      })
    } catch (e) {
      yield io.put({
        type: 'failure child',
      })
    }
  }

  function* genFnParent() {
    try {
      yield io.put({
        type: 'start parent',
      })
      yield io.call(genFnChild)
      yield io.put({
        type: 'success parent',
      })
    } catch (e) {
      yield io.put({
        type: 'failure parent',
      })
    }
  }

  const task = middleware.run(genFnParent)
  const expected = ['start parent', 'startChild', 'failure child', 'success parent']
  return task.toPromise().then(() => {
    expect(actual).toEqual(expected)
  })
})
test("saga handles call's synchronous failures and throws in the calling generator (2)", () => {
  let actual = []
  let pastStoreCreation = false

  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }

    return {}
  }

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function fail(message) {
    throw new Error(message)
  }

  function* genFnChild() {
    try {
      yield io.put({
        type: 'startChild',
      })
      yield io.call(fail, 'child error')
      yield io.put({
        type: 'success child',
      })
    } catch (e) {
      yield io.put({
        type: 'failure child',
      })
      throw e
    }
  }

  function* genFnParent() {
    try {
      yield io.put({
        type: 'start parent',
      })
      yield io.call(genFnChild)
      yield io.put({
        type: 'success parent',
      })
    } catch (e) {
      yield io.put({
        type: 'failure parent',
      })
    }
  }

  const task = middleware.run(genFnParent)
  const expected = ['start parent', 'startChild', 'failure child', 'failure parent']
  return task.toPromise().then(() => {
    expect(actual).toEqual(expected)
  })
})
test("saga handles call's synchronous failures and throws in the calling generator (2)", () => {
  let actual = []
  let pastStoreCreation = false

  const rootReducer = (state, action) => {
    if (pastStoreCreation) {
      actual.push(action.type)
    }

    return {}
  }

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  function* genFnChild() {
    throw 'child error'
  }

  function* genFnParent() {
    try {
      yield io.put({
        type: 'start parent',
      })
      yield io.call(genFnChild)
      yield io.put({
        type: 'success parent',
      })
    } catch (e) {
      yield io.put({
        type: e,
      })
      yield io.put({
        type: 'failure parent',
      })
    }
  }

  const task = middleware.run(genFnParent)
  const expected = ['start parent', 'child error', 'failure parent']
  return task.toPromise().then(() => {
    // saga should bubble synchronous call errors parent
    expect(actual).toEqual(expected)
  })
})
