import deferred from '@redux-saga/deferred'
import { arrayOfDeferred } from '@redux-saga/deferred'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { END } from '../../src'
import * as io from '../../src/effects'
test('saga parallel effects handling', () => {
  let actual
  const def = deferred()
  let cpsCb = {}

  const cps = (val, cb) =>
    (cpsCb = {
      val,
      cb,
    })

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual = yield io.all([def.promise, io.cps(cps, 2), io.take('action')])
  }

  const task = middleware.run(genFn)
  Promise.resolve(1)
    .then(() => def.resolve(1))
    .then(() => cpsCb.cb(null, cpsCb.val))
    .then(() =>
      store.dispatch({
        type: 'action',
      }),
    )
  const expected = [
    1,
    2,
    {
      type: 'action',
    },
  ]
  return task.toPromise().then(() => {
    // saga must fulfill parallel effects
    expect(actual).toEqual(expected)
  })
})
test('saga empty array', () => {
  let actual
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genFn() {
    actual = yield io.all([])
  }

  const expected = []
  const task = middleware.run(genFn)
  return task.toPromise().then(() => {
    // saga must fulfill empty parallel effects with an empty array
    expect(actual).toEqual(expected)
  })
})
test('saga parallel effect: handling errors', () => {
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
  return task.toPromise().then(() => {
    // saga must catch the first error in parallel effects
    expect(actual).toEqual(expected)
  })
})
test('saga parallel effect: handling END', () => {
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
  return task.toPromise().then(() => {
    // saga must end Parallel Effect if one of the effects resolve with END
    expect(actual).toEqual('end')
  })
})
test('saga parallel effect: named effects', () => {
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
    .then(() =>
      store.dispatch({
        type: 'action',
      }),
    )
  const expected = {
    ac: {
      type: 'action',
    },
    prom: 1,
  }
  return task.toPromise().then(() => {
    // saga must handle parallel named effects
    expect(actual).toEqual(expected)
  })
})
