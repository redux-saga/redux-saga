import sagaMiddleware from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { delay } from '../../src/effects'
import delayP from '@redux-saga/delay-p'

test('delay', () => {
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

  delayP(100).then(() => {
    expect(actual).toEqual(expected)
  })
})
