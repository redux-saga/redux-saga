import { buffers, channel, eventChannel, END } from '../src'
import mitt from 'mitt'

const eq = x => y => x === y

test('Unbuffered channel', () => {
  let chan = channel(buffers.none())
  let actual = []

  const logger = () => ac => actual.push(ac)

  try {
    chan.put(undefined)
  } catch (e) {
    // channel should reject undefined messages
    expect(/provided with an undefined/.test(e.message)).toBe(true)
  }

  chan = channel(buffers.none())
  chan.take(logger(), eq(1))
  const cb = logger()
  chan.take(cb, eq(1))
  chan.put(1) // channel must notify takers

  expect(actual).toEqual([1])
  cb.cancel()
  chan.put(1) // channel must discard cancelled takes

  expect(actual).toEqual([1])
  actual = []
  chan.take(logger())
  chan.take(logger())
  chan.close() // closing a channel must resolve all takers with END

  expect(actual).toEqual([END, END])
  actual = []
  chan.take(logger()) // closed channel must resolve new takers with END

  expect(actual).toEqual([END])
  chan.put('action-after-end') // channel must reject messages after being closed

  expect(actual).toEqual([END])
})
test('buffered channel', () => {
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
  chan.take(t1) // channel must queue pending takers if there are no buffered messages

  expect([t1.called, log, buffer]).toEqual([false, [], []])
  const t2 = taker()
  chan.take(t2)
  chan.put(1) // channel must resolve the oldest pending taker with a new message

  expect([t1.called, t2.called, log, buffer]).toEqual([true, false, [1], []])
  chan.put(2)
  chan.put(3)
  chan.put(4) // channel must buffer new messages if there are no takers

  expect([buffer, t2.called, log]).toEqual([[3, 4], true, [1, 2]])
  const t3 = taker()
  chan.take(t3) // channel must resolve new takers if there are buffered messages

  expect([t3.called, buffer, log]).toEqual([true, [4], [1, 2, 3]])
  chan.close() // closing an already closed channel should be noop

  chan.close()
  chan.put('hi')
  chan.put('I said hi') // putting on an already closed channel should be noop

  expect(buffer).toEqual([4])
  chan.take(taker()) // closed channel must resolve new takers with any buffered message

  expect([log, buffer]).toEqual([[1, 2, 3, 4], []])
  chan.take(taker()) // closed channel must resolve new takers with END if there are no buffered message

  expect(log).toEqual([1, 2, 3, 4, END])
})

test('event channel', () => {
  let unsubscribeErr

  try {
    eventChannel(() => {})
  } catch (err) {
    unsubscribeErr = err
  } // eventChannel should throw if subscriber does not return a function to unsubscribe

  expect(unsubscribeErr.message).toBe('in eventChannel: subscribe should return a function to unsubscribe')
  const em = mitt()
  let chan = eventChannel(emit => {
    em.on('*', emit)
    return () => em.off('*', emit)
  })
  let actual = []
  chan.take(ac => actual.push(ac))
  em.emit('action-1') // eventChannel must notify takers on a new action

  expect(actual).toEqual(['action-1'])
  em.emit('action-1') // eventChannel must notify takers only once

  expect(actual).toEqual(['action-1'])
  actual = []
  chan.take(ac => actual.push(ac), ac => ac === 'action-xxx')
  chan.close() // eventChannel must notify all pending takers on END

  expect(actual).toEqual([END])
  actual = []
  chan.take(ac => actual.push(ac), ac => ac === 'action-yyy') // eventChannel must notify all new takers if closed

  expect(actual).toEqual([END])
})

test('unsubscribe event channel', done => {
  let unsubscribed = false
  let chan = eventChannel(() => () => {
    unsubscribed = true
  })
  chan.close() // eventChannel should call unsubscribe when channel is closed

  expect(unsubscribed).toBe(true)
  unsubscribed = false
  chan = eventChannel(emitter => {
    emitter(END)
    return () => {
      unsubscribed = true
    }
  }) // eventChannel should call unsubscribe when END event is emitted synchronously

  expect(unsubscribed).toBe(true)
  unsubscribed = false
  chan = eventChannel(emitter => {
    setTimeout(() => emitter(END), 0)
    return () => {
      unsubscribed = true
    }
  })

  chan.take(input => {
    // should emit END event
    expect(input).toBe(END) // eventChannel should call unsubscribe when END event is emitted asynchronously

    expect(unsubscribed).toBe(true)
    done()
  })
})

test('expanding buffer', () => {
  let chan = channel(buffers.expanding(2))
  chan.put('action-1')
  chan.put('action-2')
  chan.put('action-3')
  let actual
  chan.flush(items => (actual = items.length))
  let expected = 3 // expanding buffer should be able to buffer more items than its initial limit

  expect(actual).toBe(expected)
})
