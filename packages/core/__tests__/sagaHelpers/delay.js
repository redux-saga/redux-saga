import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { delay, call } from '../../src/effects'
import delayP from '@redux-saga/delay-p'

test('delay', async () => {
  const actual = []
  const myVal = 'myValue'
  const expected = [true, myVal]
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)

  function* saga() {
    actual.push(yield delay(1))
    actual.push(yield delay(1, myVal))
  }

  await delayP(100)

  expect(actual).toEqual(expected)
})

test('delay when the timeout value exceeds the maximum allowed value', () => {
  let actual
  const middleware = sagaMiddleware({
    onError: (err) => {
      actual = err
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    yield delay(2147483648)
  }

  function* main() {
    yield call(child)
  }

  const task = middleware.run(main)
  return task.toPromise().catch(() => {
    expect(actual).toEqual(new Error('delay only supports a maximum value of 2147483647ms'))
  })
})
