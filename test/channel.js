import test from 'tape';
import { emitter, channel, eventChannel, END, UNDEFINED_INPUT_ERROR } from '../src/internal/channel'

const eq = x => y => x === y

test('emitter', assert => {
  assert.plan(1);

  const em = emitter()
  const actual = []

  const unsub1 = em.subscribe(e => actual.push(`1:${e}`))
  const unsub2 = em.subscribe(e => actual.push(`2:${e}`))

  em.emit('e1')
  unsub1()
  em.emit('e2')
  unsub2()
  em.emit('e3')

  const expected = ['1:e1', '2:e1', '2:e2']
  assert.deepEqual(actual, expected, 'emitter should notify subscribers')

});

test('channel', assert => {

  let chan = channel()
  let actual = []
  const logger = () => (ac) => actual.push(ac)

  try {
    chan.put(undefined)
  } catch (e) {
    assert.equal(e.message, UNDEFINED_INPUT_ERROR, 'channel should reject undefined messages')
  }

  chan = channel()

  chan.take(logger(), eq(1))
  const cb = logger()
  chan.take(cb, eq(1))

  chan.put(1)
  assert.deepEqual(actual, [1], 'channel must notify takers')

  cb.cancel()
  chan.put(1)
  assert.deepEqual(actual, [1], 'channel must discard cancelled takes')

  actual = []
  chan.take(logger())
  chan.take(logger())
  chan.close()
  assert.deepEqual(actual,  [END, END], 'closing a channel must resolve all takers with END ')

  actual = []
  chan.take(logger())
  assert.deepEqual(actual, [END], 'closed channel must resolve new takers with END')
  chan.put('action-after-end')
  assert.deepEqual(actual, [END], 'channel must reject messages after being closed')

  assert.end()
});

test('event channel', assert => {

  const em = emitter()
  let chan = eventChannel(em.subscribe)
  let actual = []

  chan.take((ac) => actual.push(ac))
  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers on a new action')

  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers only once')

  actual = []
  chan.take((ac) => actual.push(ac), ac => ac === 'action-xxx')
  chan.close()
  assert.deepEqual(actual, [END], 'eventChannel must notify all pending takers on END')

  actual = []
  chan.take((ac) => actual.push(ac), ac => ac === 'action-yyy')
  assert.deepEqual(actual, [END], 'eventChannel must notify all new takers if closed')


  assert.end()
});
