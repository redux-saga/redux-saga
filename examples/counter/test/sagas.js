import test from 'tape';

import sagas from '../src/sagas'
import { delay } from '../src/services'
import * as actions from '../src/actions/counter'


const [incrementAsyncSaga, onBoardingSaga] = sagas
const getState = () => 0

test('counter Saga test', function (t) {
  const generator = incrementAsyncSaga(getState)

  generator.next(actions.incrementAsync())

  let next = generator.next()
  t.deepEqual(next.value, [delay, 1000], 'must yield a delay effect')

  next= generator.next()
  t.deepEqual(next.value, actions.increment(), 'must yield an increment action')

  t.end()
});
