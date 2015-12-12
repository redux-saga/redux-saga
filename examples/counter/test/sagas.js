import test from 'tape';

import { io } from '../../../src'
import sagas from '../src/sagas'
import { delay } from '../src/services'
import * as actions from '../src/actions/counter'
import * as types from '../src/constants'


const [incrementAsyncSaga, onBoardingSaga] = sagas
const getState = () => 0


test('counter Saga test', (t) => {
  const generator = incrementAsyncSaga(io, getState)
  let next

  for (let i = 0; i < 2; i++) {
    next = generator.next()
    t.deepEqual(next.value, io.wait(types.INCREMENT_ASYNC),
      'counter Saga must wait for the next INCREMENT_ASYNC action'
    )

    next = generator.next(actions.increment())
    t.deepEqual(next.value, io.call(delay, 1000),
      'counter Saga must call delay(1000)'
    )

    next= generator.next()
    t.deepEqual(next.value, io.action(actions.increment()),
      'counter Saga must dispatch an INCREMENT_COUNTER action'
    )
  }
  t.end()
});

test('onBoarding Saga test', (t) => {
  const generator = onBoardingSaga(io, getState)
  const MESSAGE = 'onBoarding Saga must wait for INCREMENT_COUNTER/delay(1000)'

  const expectedRace = io.race({
    increment : io.wait(types.INCREMENT_COUNTER),
    timeout   : io.call(delay, 5000)
  })

  let next = generator.next()
  t.deepEqual(next.value, expectedRace, MESSAGE)

  next = generator.next({increment: actions.increment()})
  t.deepEqual(next.value, expectedRace, MESSAGE)

  next = generator.next({increment: actions.increment()})
  t.deepEqual(next.value, expectedRace, MESSAGE)

  next = generator.next({increment: actions.increment()})
  t.deepEqual(next.value, io.action(actions.showCongratulation()),
    'onBoarding Saga must dispatch a SHOW_CONGRATULATION action after 3 INCREMENT_COUNTER actions'
  )

  next = generator.next()
  t.equal(next.done, true,
    'onBoarding Saga must ends after dispatching the SHOW_CONGRATULATION action'
  )

  t.end()
});
