import { test, expect } from 'vitest'

import { put, delay } from 'redux-saga/effects'
import { incrementAsync } from '../src/sagas'

test('incrementAsync Saga test', () => {
  const generator = incrementAsync()

  expect(generator.next().value, 'counter Saga must call delay(1000)').toEqual(delay(1000))

  expect(generator.next().value, 'counter Saga must dispatch an INCREMENT action').toEqual(put({ type: 'INCREMENT' }))

  expect(generator.next(), 'counter Saga must be done').toEqual({ done: true, value: undefined })
})
