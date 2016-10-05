import test from 'tape';

import { takeEvery } from '../../../src'
import { put, call } from '../../../src/effects'
import { delay } from '../../../src'
import rootSaga, { incrementAsync } from '../src/sagas'

test('incrementAsync Saga test', (t) => {
  const generator = incrementAsync()

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

  t.deepEqual(
    generator.next(),
    { done: true, value: undefined },
    'counter Saga must be done'
  )

  const watcher = rootSaga()
  const worker = takeEvery('INCREMENT_ASYNC', incrementAsync);

  t.deepEqual(
    watcher.next().value,
    worker.next().value,
    'rootSaga takes from every INCREMENT_ASYNC action'
  )

  t.equal(
    watcher.return().done,
    true,
    'rootSaga finishes if canceled (returned)'
  )

  t.end()
});
