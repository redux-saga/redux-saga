import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { END } from '../../src'
import { deferred, arrayOfDeferred } from '../../src/utils'
import * as io from '../../src/effects'

test('saga parallel effects handling', assert => {
  assert.plan(1)

  let actual
  const def = deferred()

  let cpsCb = {}
  const cps = (val, cb) => (cpsCb = { val, cb })

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual = yield io.all([def.promise, io.cps(cps, 2), io.take('action')])
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => def.resolve(1))
    .then(() => cpsCb.cb(null, cpsCb.val))
    .then(() => store.dispatch({ type: 'action' }))

  const expected = [1, 2, { type: 'action' }]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill parallel effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga empty array', assert => {
  assert.plan(1)

  let actual

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual = yield io.all([])
  }

  const expected = []

  const task = middleware.run(genFn)

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill empty parallel effects with an empty array')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga parallel effect: handling errors', assert => {
  assert.plan(1)

  let actual
  const defs = arrayOfDeferred(2)

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  Promise.resolve(1)
    .then(() => defs[0].reject('error'))
    .then(() => defs[1].resolve(1))

  function* genFn() {
    try {
      actual = yield io.all([defs[0].promise, defs[1].promise])
    } catch (err) {
      actual = [err]
    }
  }

  const task = middleware.run(genFn)

  const expected = ['error']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must catch the first error in parallel effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga parallel effect: handling END', assert => {
  assert.plan(1)

  let actual
  const def = deferred()

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    try {
      actual = yield io.all([def.promise, io.take('action')])
    } finally {
      actual = 'end'
    }
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => def.resolve(1))
    .then(() => store.dispatch(END))

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, 'end', 'saga must end Parallel Effect if one of the effects resolve with END')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga parallel effect: named effects', assert => {
  assert.plan(1)

  let actual
  const def = deferred()

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual = yield io.all({
      ac: io.take('action'),
      prom: def.promise,
    })
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => def.resolve(1))
    .then(() => store.dispatch({ type: 'action' }))

  const expected = { ac: { type: 'action' }, prom: 1 }

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must handle parallel named effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
