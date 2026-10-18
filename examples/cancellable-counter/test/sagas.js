import { test, expect } from 'vitest'
import { take, put, race, call, cancelled } from 'redux-saga/effects'
import { INCREMENT_ASYNC, INCREMENT, CANCEL_INCREMENT_ASYNC, COUNTDOWN_TERMINATED } from '../src/actionTypes'

import { watchIncrementAsync, incrementAsync, countdown } from '../src/sagas'

const getState = () => ({
  value: 10,
})
const action = (type) => ({ type })

test('watchIncrementAsync Saga', () => {
  const generator = watchIncrementAsync()
  let next

  next = generator.next()
  expect(next.value, 'watchIncrementAsync takes INCRMEMENT_ASYNC action').toEqual(take(INCREMENT_ASYNC))

  next = generator.next(getState())
  expect(next.value, 'starts Race between async incremention and cancellation').toEqual(
    race([call(incrementAsync, getState()), take(CANCEL_INCREMENT_ASYNC)]),
  )
})

test('incrementAsync Saga successful', () => {
  const generator = incrementAsync(getState())
  let next

  next = generator.next()
  expect(next.value, 'counter Saga instantiates channel emitter').toEqual(call(countdown, getState().value))

  const chan = countdown(getState().value)

  next = generator.next(chan)
  expect(next.value, 'take action from eventChannel').toEqual(take(chan))

  next = generator.next(9)
  expect(next.value, 'updates countdown value in the store').toEqual(put({ type: INCREMENT_ASYNC, value: 9 }))

  //end smoothly the saga
  next = generator.return()
  expect(next.value, 'eventEmitter is done').toEqual(cancelled())

  //resume the saga
  next = generator.next(false)
  expect(next.value, 'Actual increment is performed').toEqual(put(action(INCREMENT)))

  next = generator.next()
  expect(next.value, 'The countdown is terminated').toEqual(put(action(COUNTDOWN_TERMINATED)))
})

test('incrementAsync Saga with cancellation', () => {
  const generator = incrementAsync(getState())
  let next

  next = generator.next()

  expect(next.value, 'instanciation of the channel emitter with the provided value to wait').toEqual(
    call(countdown, getState().value),
  )

  const chan = countdown(getState().value)

  next = generator.next(chan)
  expect(next.value, 'takes action from eventChannel').toEqual(take(chan))

  next = generator.next(9)
  expect(next.value, 'put counter value to store').toEqual(put({ type: INCREMENT_ASYNC, value: 9 }))

  //end the saga
  next = generator.return()
  expect(next.value, 'eventEmitter is done').toEqual(cancelled())

  //resume the saga with a cancel call
  next = generator.next(true)
  expect(next.done, 'Saga is done').toBe(true)
})
