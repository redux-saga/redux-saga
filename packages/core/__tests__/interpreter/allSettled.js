import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('saga parallel effects handling', () => {
  let actual

  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual = yield io.allSettled([
      Promise.resolve(1),
      Promise.reject(2),
      new Promise(res => setTimeout(() => res(3), 100)),
      new Promise((res, rej) => setTimeout(() => rej(4), 200)),
    ])
  }

  const task = middleware.run(genFn)
  const expected = [
    { status: 'fulfilled', value: 1 },
    { status: 'rejected', reason: 2 },
    { status: 'fulfilled', value: 3 },
    { status: 'rejected', reason: 4 },
  ]
  return task.toPromise().then(() => {
    // saga must fulfill parallel effects
    expect(actual).toEqual(expected)
  })
})
