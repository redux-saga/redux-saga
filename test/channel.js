import test from 'tape';
import { emitter, channel, eventChannel, END, UNDEFINED_INPUT_ERROR } from '../src/internal/channel'
import { buffers } from '../src/internal/buffers'

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

test('Unbuffered channel', assert => {

  let chan = channel(buffers.none())
  let actual = []
  const logger = () => (ac) => actual.push(ac)

  try {
    chan.put(undefined)
  } catch (e) {
    assert.equal(e.message, UNDEFINED_INPUT_ERROR, 'channel should reject undefined messages')
  }

  chan = channel(buffers.none())

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

test('buffered channel', assert => {

  const buffer = []
  const spyBuffer = {
    isEmpty: () => !buffer.length,
    put: (it) => buffer.push(it),
    take: () => buffer.shift()
  }

  let chan = channel(spyBuffer)
  let log = []
  const taker = () => (ac) => log.push(ac)

  const state = () => [chan.__closed__, chan.__takers__, buffer, log]

  var t1 = taker()
  chan.take(t1)
  assert.deepEqual(
    state(),
    [
      /* closed? */ false,
      /* takers  */ [t1],
      /* buffer  */ [],
      /* log     */ []
    ],
    'channel must queue pending takers if there are no buffered messages')

    const t2 = taker()
    chan.take(t2)
    chan.put(1)
    assert.deepEqual(
      state(),
      [
        /* closed? */ false,
        /* takers  */ [t2],
        /* buffer  */ [],
        /* log     */ [1]
      ],
      'channel must resolve the oldest penfing taker with a new message')

    chan.put(2)
    chan.put(3)
    chan.put(4)
    //try {
    //  chan.put(5)
    //} catch(err) {
    //  assert.equal(err.message, BUFFER_OVERFLOW)
    //}
    assert.deepEqual(
      state(),
      [
        /* closed? */ false,
        /* takers  */ [],
        /* buffer  */ [3,4],
        /* log     */ [1,2]
      ],
      'channel must buffer new messages if there are no takers')

    chan.take(taker())
    assert.deepEqual(
      state(),
      [
        /* closed? */ false,
        /* takers  */ [],
        /* buffer  */ [4],
        /* log     */ [1,2,3]
      ],
      'channel must resolve new takers if there are buffered messages')

    chan.close()
    assert.deepEqual(
      state(),
      [
        /* closed? */ true,
        /* takers  */ [],
        /* buffer  */ [4],
        /* log     */ [1,2,3]
      ],
      'channel must set closed state to true')

    chan.close()
    assert.deepEqual(
      state(),
      [
        /* closed? */ true,
        /* takers  */ [],
        /* buffer  */ [4],
        /* log     */ [1,2,3]
      ],
      'closing an already closed channel should be noop')

    chan.put('hi')
    chan.put('I said hi')
    assert.deepEqual(
      state(),
      [
        /* closed? */ true,
        /* takers  */ [],
        /* buffer  */ [4],
        /* log     */ [1,2,3]
      ],
      'putting on an already closed channel should be noop')

    chan.take(taker())
    assert.deepEqual(
      state(),
      [
        /* closed? */ true,
        /* takers  */ [],
        /* buffer  */ [],
        /* log     */ [1,2,3,4]
      ],
      'closed channel must resolve new takers with any buffered message')

      chan.take(taker())
      assert.deepEqual(
        state(),
        [
          /* closed? */ true,
          /* takers  */ [],
          /* buffer  */ [],
          /* log     */ [1,2,3,4, END]
        ],
        'closed channel must resolve new takers with END if there are no buffered message')

  assert.end()
});

test('event channel', assert => {
  let unsubscribeErr
  try {
    eventChannel(() => {})
  } catch(err) {
    unsubscribeErr = err
  }

  assert.ok(unsubscribeErr, 'eventChannel should throw if subscriber does not return a function to unsubscribe')

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

test('expanding buffer', assert => {
  let chan = channel(buffers.expanding(2))

  chan.put('action-1')
  chan.put('action-2')
  chan.put('action-3')

  let actual
  chan.flush((items) => actual = items.length)
  let expected = 3

  assert.equal(actual, expected, 'expanding buffer should be able to buffer more items than its initial limit')
  assert.end()
});
