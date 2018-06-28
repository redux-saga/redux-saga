import test from 'tape'
import { buffers, channel, eventChannel, END } from '../src'
import mitt from 'mitt'

const eq = x => y => x === y

test('Unbuffered channel', assert => {
  let chan = channel(buffers.none())
  let actual = []
  const logger = () => ac => actual.push(ac)

  try {
    chan.put(undefined)
  } catch (e) {
    assert.ok(/provided with an undefined/.test(e.message), 'channel should reject undefined messages')
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
  assert.deepEqual(actual, [END, END], 'closing a channel must resolve all takers with END ')

  actual = []
  chan.take(logger())
  assert.deepEqual(actual, [END], 'closed channel must resolve new takers with END')
  chan.put('action-after-end')
  assert.deepEqual(actual, [END], 'channel must reject messages after being closed')

  assert.end()
})

test('buffered channel', assert => {
  const buffer = []
  const spyBuffer = {
    isEmpty: () => !buffer.length,
    put: it => buffer.push(it),
    take: () => buffer.shift(),
  }

  let chan = channel(spyBuffer)
  let log = []
  const taker = () => {
    const _taker = ac => {
      _taker.called = true
      log.push(ac)
    }
    _taker.called = false
    return _taker
  }

  var t1 = taker()
  chan.take(t1)

  assert.deepEqual(
    [t1.called, log, buffer],
    [false, [], []],
    'channel must queue pending takers if there are no buffered messages',
  )

  const t2 = taker()
  chan.take(t2)
  chan.put(1)

  assert.deepEqual(
    [t1.called, t2.called, log, buffer],
    [true, false, [1], []],
    'channel must resolve the oldest pending taker with a new message',
  )

  chan.put(2)
  chan.put(3)
  chan.put(4)

  assert.deepEqual(
    [buffer, t2.called, log],
    [[3, 4], true, [1, 2]],
    'channel must buffer new messages if there are no takers',
  )

  const t3 = taker()
  chan.take(t3)

  assert.deepEqual(
    [t3.called, buffer, log],
    [true, [4], [1, 2, 3]],
    'channel must resolve new takers if there are buffered messages',
  )

  chan.close()

  // closing an already closed channel should be noop
  chan.close()

  chan.put('hi')
  chan.put('I said hi')

  assert.deepEqual(buffer, [4], 'putting on an already closed channel should be noop')

  chan.take(taker())

  assert.deepEqual(
    [log, buffer],
    [[1, 2, 3, 4], []],
    'closed channel must resolve new takers with any buffered message',
  )

  chan.take(taker())

  assert.deepEqual(
    log,
    [1, 2, 3, 4, END],
    'closed channel must resolve new takers with END if there are no buffered message',
  )

  assert.end()
})

test('event channel', assert => {
  let unsubscribeErr
  try {
    eventChannel(() => {})
  } catch (err) {
    unsubscribeErr = err
  }

  assert.ok(unsubscribeErr, 'eventChannel should throw if subscriber does not return a function to unsubscribe')

  const em = mitt()
  let chan = eventChannel(emit => {
    em.on('*', emit)
    return () => em.off('*', emit)
  })
  let actual = []

  chan.take(ac => actual.push(ac))
  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers on a new action')

  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers only once')

  actual = []
  chan.take(ac => actual.push(ac), ac => ac === 'action-xxx')
  chan.close()
  assert.deepEqual(actual, [END], 'eventChannel must notify all pending takers on END')

  actual = []
  chan.take(ac => actual.push(ac), ac => ac === 'action-yyy')
  assert.deepEqual(actual, [END], 'eventChannel must notify all new takers if closed')

  assert.end()
})

test('unsubscribe event channel', assert => {
  let unsubscribed = false
  let chan = eventChannel(() => () => {
    unsubscribed = true
  })
  chan.close()
  assert.ok(unsubscribed, 'eventChannel should call unsubscribe when channel is closed')

  unsubscribed = false
  chan = eventChannel(emitter => {
    emitter(END)
    return () => {
      unsubscribed = true
    }
  })
  assert.ok(unsubscribed, 'eventChannel should call unsubscribe when END event is emitted synchronously')

  unsubscribed = false
  chan = eventChannel(emitter => {
    setTimeout(() => emitter(END), 0)
    return () => {
      unsubscribed = true
    }
  })
  chan.take(input => {
    assert.equal(input, END, 'should emit END event')
    assert.ok(unsubscribed, 'eventChannel should call unsubscribe when END event is emitted asynchronously')
    assert.end()
  })
})

test('expanding buffer', assert => {
  let chan = channel(buffers.expanding(2))

  chan.put('action-1')
  chan.put('action-2')
  chan.put('action-3')

  let actual
  chan.flush(items => (actual = items.length))
  let expected = 3

  assert.equal(actual, expected, 'expanding buffer should be able to buffer more items than its initial limit')
  assert.end()
})
