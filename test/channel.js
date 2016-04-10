import test from 'tape';
import { emitter, channel, eventChannel, END, MSG_AFTER_END_ERROR, UNDEFINED_INPUT_ERROR } from '../src/internal/channel'

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
  let expected
  const makeCb = () => (err, ac) => actual.push(ac)

  try {
    chan.put(undefined)
  } catch (e) {
    assert.equal(e.message, UNDEFINED_INPUT_ERROR, 'channel should reject undefined messages')
  }

  chan = channel()
  chan.take('*', makeCb())
  chan.take('action-1', makeCb())
  const cb2 = makeCb()
  chan.take('action-2', cb2)

  chan.put({type: 'action-1'})

  expected = [{type: 'action-1'}, {type: 'action-1'}]
  assert.deepEqual(actual, expected, 'channel must fullfill takes')

  cb2.cancel()
  chan.put({type: 'action-2'})
  assert.deepEqual(actual, expected, 'channel must discard cancelled takes')

  actual = []
  chan.take('action-never-happening', makeCb())
  chan.take('action-never-happening2', makeCb())
  chan.close()
  expected = [END, END]
  assert.deepEqual(actual, expected, 'channel must broadcast END message')

  try {
    chan.put('action-after-end')
  } catch (e) {
    assert.equal(e.message, MSG_AFTER_END_ERROR, 'channel must reject messages after being closed')
  }

  chan = channel()
  actual = []

  chan.take('action-never-happening', err => {
    assert.equal(err.message, 'error')
  })
  chan.put(new Error('error'))

  try {
    chan.put('action-after-error')
  } catch (e) {
    assert.equal(e.message, MSG_AFTER_END_ERROR, 'channel must reject messages after being aborted')
  }
  assert.end()
});

test('event channel', assert => {

  const em = emitter()
  let chan = eventChannel(em.subscribe)
  let actual = []

  chan.take((err, ac) => actual.push(ac))
  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers on a new action')

  em.emit('action-1')
  assert.deepEqual(actual, ['action-1'], 'eventChannel must notify takers only once')

  actual = []
  chan.take('action-xxx', (err, ac) => actual.push(ac))
  chan.close()
  assert.deepEqual(actual, [END], 'eventChannel must notify all pending takers on END')

  actual = []
  chan.take('action-yyy', (err, ac) => actual.push(ac))
  assert.deepEqual(actual, [END], 'eventChannel must notify all new takers if closed')


  assert.end()
});
