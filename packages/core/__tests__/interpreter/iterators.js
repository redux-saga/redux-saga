import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { arrayOfDeferred } from '@redux-saga/deferred'
import * as io from '../../src/effects'
test('saga nested iterator handling', () => {
  let actual = []
  let defs = arrayOfDeferred(3)
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* child() {
    actual.push(yield defs[0].promise)
    actual.push(yield io.take('action-1'))
    actual.push(yield defs[1].promise)
    actual.push(yield io.take('action-2'))
    actual.push(yield defs[2].promise)
    actual.push(yield io.take('action-3'))
    actual.push(yield Promise.reject('child error'))
  }

  function* main() {
    try {
      yield child()
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const expected = [
    1,
    {
      type: 'action-1',
    },
    2,
    {
      type: 'action-2',
    },
    3,
    {
      type: 'action-3',
    },
    'caught child error',
  ]
  const task = middleware.run(main)
  Promise.resolve(1)
    .then(() => defs[0].resolve(1))
    .then(() =>
      store.dispatch({
        type: 'action-1',
      }),
    )
    .then(() => defs[1].resolve(2))
    .then(() =>
      store.dispatch({
        type: 'action-2',
      }),
    )
    .then(() => defs[2].resolve(3))
    .then(() =>
      store.dispatch({
        type: 'action-3',
      }),
    )
  return task.toPromise().then(() => {
    // saga must fulfill nested iterator effects
    expect(actual).toEqual(expected)
  })
})
