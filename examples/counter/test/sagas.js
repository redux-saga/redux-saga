import test from 'tape';

import { put, call } from '../../../src/effects'
import { incrementAsync, delay } from '../src/sagas'


const getState = () => 0


test('incrementAsync Saga test', (t) => {
  const generator = incrementAsync(getState)

  t.deepEqual(
    generator.next().value,
    call(delay, 1000),
    'counter Saga must call delay(1000)'
  )

  t.deepEqual(
    generator.next().value,
    put({type: 'INCREMENT'}),
    'counter Saga must dispatch an INCREMENT action'
  )

  t.end()
});
