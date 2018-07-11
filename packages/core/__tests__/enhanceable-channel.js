import { takeEvery } from '../src/internal/io-helpers'
import { runSaga, stdChannel } from '../src'
import { put } from '../src/effects'
import mitt from 'mitt'

test('enhance a channel with a custom emitter', () => {
  const actual = []

  const emitter = emit => action => {
    if (action.type === 'batch') {
      action.batch.forEach(emit)
      return
    }
    emit(action)
  }
  const channel = stdChannel().enhancePut(emitter)
  runSaga({ channel }, function*() {
    yield takeEvery('*', ac => actual.push(ac.type))
  })

  channel.put({ type: 'a' })
  channel.put({
    type: 'batch',
    batch: [{ type: 'b' }, { type: 'c' }, { type: 'd' }],
  })
  channel.put({ type: 'e' })

  expect(actual).toEqual(['a', 'b', 'c', 'd', 'e'])
})

test('external IO: connect channel to an emitter', () => {
  const emitterCollected = []
  const takeEveryCollected = []

  const mit = mitt()
  const channel = stdChannel().enhancePut(oldPut => {
    mit.on('action', ac => emitterCollected.push(ac.type))

    // when the emitter gets an action, put it into the channel via the old-put
    mit.on('action', oldPut)

    // return a new-put to replace the old-put
    return ac => mit.emit('action', ac)
  })

  runSaga({ channel }, function*() {
    yield takeEvery('*', ac => takeEveryCollected.push(ac.type))
    yield put({ type: 'FROM_PUT_EFFECT' })
  })

  channel.put({ type: 'FROM_CHANNEL_PUT' })
  mit.emit('action', { type: 'FROM_EMITTER' })

  const expected = ['FROM_PUT_EFFECT', 'FROM_CHANNEL_PUT', 'FROM_EMITTER']
  expect(emitterCollected).toEqual(expected)
  expect(takeEveryCollected).toEqual(expected)
})

class FakeSubject {
  constructor() {
    this.listeners = []
  }

  next(value) {
    this.listeners.forEach(f => f(value))
  }

  subscribe(listener) {
    this.listeners.push(listener)
  }
}

test('external IO: connect channel to a RxJS Subject', () => {
  const subjectCollected = []
  const takeEveryCollected = []

  const subject = new FakeSubject()
  const channel = stdChannel().enhancePut(oldPut => {
    subject.subscribe(oldPut)
    subject.subscribe(ac => subjectCollected.push(ac.type))
    return ac => subject.next(ac)
  })

  runSaga({ channel }, function* saga() {
    yield takeEvery('*', ac => takeEveryCollected.push(ac.type))
    yield put({ type: 'FROM_PUT_EFFECT' })
  })

  channel.put({ type: 'FROM_CHANNEL_PUT' })
  subject.next({ type: 'FROM_SUBJECT_NEXT' })

  const expected = ['FROM_PUT_EFFECT', 'FROM_CHANNEL_PUT', 'FROM_SUBJECT_NEXT']
  expect(subjectCollected).toEqual(expected)
  expect(takeEveryCollected).toEqual(expected)
})
