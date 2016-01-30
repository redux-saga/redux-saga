
import test from 'tape';
import SagaCancellationException from '../src/SagaCancellationException'

test('SagaCancellationException', assert => {

  const ex = new SagaCancellationException('MANUAL', 'saga', 'origin')

  assert.ok(ex instanceof Error,
    'exception must be an instance of Error')

  assert.ok(ex instanceof SagaCancellationException,
    'exception must be an instance of SagaCancellationException');

  assert.equal(ex.name, 'SagaCancellationException')
  assert.equal(ex.message, `SagaCancellationException; type: MANUAL, saga: saga, origin: origin`)
  assert.equal(ex.type, 'MANUAL', 'should have type field')
  assert.equal(ex.saga, 'saga', 'should have saga field')
  assert.equal(ex.origin, 'origin', 'should have origin field')

  assert.end();
});
