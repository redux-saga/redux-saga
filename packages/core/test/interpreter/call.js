import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('saga handles call effects and resume with the resolved values', assert => {
  assert.plan(1)

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

  function* subGen(io, arg) {
    yield Promise.resolve(null)
    return arg
  }

  function* genFn() {
    actual.push(yield io.call([inst1, inst1.method]))
    actual.push(yield io.call([inst2, 'method']))
    actual.push(yield io.apply(inst3, inst3.method))
    actual.push(yield io.apply(inst4, 'method'))
    actual.push(yield io.call(subGen, io, 5))
  }

  const task = middleware.run(genFn)

  const expected = [1, 2, 3, 4, 5]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill declarative call effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga handles call effects and throw the rejected values inside the generator', assert => {
  assert.plan(1)

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
      yield io.put({ type: 'start' })
      yield io.call(fail, 'failure')
      yield io.put({ type: 'success' })
    } catch (e) {
      yield io.put({ type: e })
    }
  }

  const task = middleware.run(genFnParent)

  const expected = ['start', 'failure']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga dispatches appropriate actions')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga handles call's synchronous failures and throws in the calling generator (1)", assert => {
  assert.plan(1)

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
      yield io.put({ type: 'startChild' })
      yield io.call(fail, 'child error')
      yield io.put({ type: 'success child' })
    } catch (e) {
      yield io.put({ type: 'failure child' })
    }
  }

  function* genFnParent() {
    try {
      yield io.put({ type: 'start parent' })
      yield io.call(genFnChild)
      yield io.put({ type: 'success parent' })
    } catch (e) {
      yield io.put({ type: 'failure parent' })
    }
  }

  const task = middleware.run(genFnParent)

  const expected = ['start parent', 'startChild', 'failure child', 'success parent']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga dispatches appropriate actions')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga handles call's synchronous failures and throws in the calling generator (2)", assert => {
  assert.plan(1)

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
      yield io.put({ type: 'startChild' })
      yield io.call(fail, 'child error')
      yield io.put({ type: 'success child' })
    } catch (e) {
      yield io.put({ type: 'failure child' })
      throw e
    }
  }

  function* genFnParent() {
    try {
      yield io.put({ type: 'start parent' })
      yield io.call(genFnChild)
      yield io.put({ type: 'success parent' })
    } catch (e) {
      yield io.put({ type: 'failure parent' })
    }
  }

  const task = middleware.run(genFnParent)

  const expected = ['start parent', 'startChild', 'failure child', 'failure parent']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga dispatches appropriate actions')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga handles call's synchronous failures and throws in the calling generator (2)", assert => {
  assert.plan(1)

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
      yield io.put({ type: 'start parent' })
      yield io.call(genFnChild)
      yield io.put({ type: 'success parent' })
    } catch (e) {
      yield io.put({ type: e })
      yield io.put({ type: 'failure parent' })
    }
  }

  const task = middleware.run(genFnParent)

  const expected = ['start parent', 'child error', 'failure parent']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga should bubble synchronous call errors parent')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
