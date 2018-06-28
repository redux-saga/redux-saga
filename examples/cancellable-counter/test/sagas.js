import test from 'tape'
import { take, put, race, call, cancelled } from 'redux-saga/effects'
import {
  INCREMENT_ASYNC,
  INCREMENT,
  CANCEL_INCREMENT_ASYNC,
  COUNTDOWN_TERMINATED,
} from '../src/actionTypes'

import { watchIncrementAsync, incrementAsync, countdown } from '../src/sagas'

const getState = () => ({
  value: 10,
})
const action = type => ({ type })

test('watchIncrementAsync Saga', async t => {
  const generator = watchIncrementAsync()
  let next

  next = generator.next()
  t.deepEqual(
    next.value,
    take(INCREMENT_ASYNC),
    'watchIncrementAsync takes INCRMEMENT_ASYNC action',
  )

  next = generator.next(getState())
  t.deepEqual(
    next.value,
    race([call(incrementAsync, getState()), take(CANCEL_INCREMENT_ASYNC)]),
    'starts Race between async incremention and cancellation',
  )

  t.end()
})

test('incrementAsync Saga successful', async t => {
  const generator = incrementAsync(getState())
  let next

  next = generator.next()
  t.deepEqual(
    next.value,
    call(countdown, getState().value),
    'counter Saga instantiates channel emitter',
  )

  const chan = countdown(getState().value)

  next = generator.next(chan)
  t.deepEqual(next.value, take(chan), 'take action from eventChannel')

  next = generator.next(9)
  t.deepEqual(
    next.value,
    put({ type: INCREMENT_ASYNC, value: 9 }),
    'updates countdown value in the store',
  )

  //end smoothly the saga
  next = generator.return()
  t.deepEqual(next.value, cancelled(), 'eventEmitter is done')

  //resume the saga
  next = generator.next(false)
  t.deepEqual(
    next.value,
    put(action(INCREMENT)),
    'Actual increment is performed',
  )

  next = generator.next()
  t.deepEqual(
    next.value,
    put(action(COUNTDOWN_TERMINATED)),
    'The countdown is terminated',
  )

  t.end()
})

test('incrementAsync Saga with cancellation', async t => {
  const generator = incrementAsync(getState())
  let next

  next = generator.next()

  t.deepEqual(
    next.value,
    call(countdown, getState().value),
    'instanciation of the channel emitter with the provided value to wait',
  )

  const chan = countdown(getState().value)

  next = generator.next(chan)
  t.deepEqual(next.value, take(chan), 'takes action from eventChannel')

  next = generator.next(9)
  t.deepEqual(
    next.value,
    put({ type: INCREMENT_ASYNC, value: 9 }),
    'put counter value to store',
  )

  //end the saga
  next = generator.return()
  t.deepEqual(next.value, cancelled(), 'eventEmitter is done')

  //resume the saga with a cancel call
  next = generator.next(true)
  t.deepEqual(next.done, true, 'Saga is done')

  t.end()
})
