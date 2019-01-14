/* eslint-disable no-unused-vars, no-constant-condition */
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../src'
import { take, put, fork, join, call, race, cancel, actionChannel } from '../src/effects'
import { channel, buffers, END } from '../src'

test('action channel', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* saga() {
    const chan = yield actionChannel('ACTION')

    while (true) {
      const { payload } = yield take(chan)
      actual.push(payload)
      yield Promise.resolve() // block
    }
  }

  const taskP = middleware.run(saga).toPromise()

  for (var i = 0; i < 3; i++) {
    store.dispatch({
      type: 'ACTION',
      payload: i + 1,
    })
  }

  store.dispatch(END)

  return taskP.then(() => {
    // Sagas must take consecutive actions dispatched synchronously on an action channel even if it performs blocking calls
    expect(actual).toEqual([1, 2, 3])
  })
})

test('error check when constructing actionChannels', () => {
  const middleware = sagaMiddleware({
    onError: err => {
      expect(err.message).toMatchInlineSnapshot(`"actionChannel(pattern,...): argument pattern is not valid"`)
    },
  })
  applyMiddleware(middleware)(createStore)(() => {})

  function* saga() {
    yield actionChannel(['ACTION', undefined])
  }

  const promise = middleware.run(saga).toPromise()
  return expect(promise).rejects.toThrow('argument pattern is not valid')
})

test('action channel generator', () => {
  function* saga() {
    const chan = yield actionChannel('ACTION')

    while (true) {
      const { payload } = yield take(chan)
      yield Promise.resolve() // block
    }
  }

  let gen = saga()
  let chan = actionChannel('ACTION')
  expect(gen.next().value).toEqual(chan)
  const mockChannel = channel()
  expect(gen.next(mockChannel).value).toEqual(take(mockChannel))
})
test('action channel generator with buffers', () => {
  function* saga() {
    const buffer = yield call(buffers.dropping, 1)
    const chan = yield actionChannel('ACTION', buffer)

    while (true) {
      const { payload } = yield take(chan)
      yield Promise.resolve() // block
    }
  }

  let gen = saga()
  expect(gen.next().value).toEqual(call(buffers.dropping, 1))
  let buffer = buffers.dropping(1)
  let chan = actionChannel('ACTION', buffer)
  expect(gen.next(buffer).value).toEqual(chan)
  const mockChannel = channel()
  expect(gen.next(mockChannel).value).toEqual(take(mockChannel))
})
test('channel: watcher + max workers', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* saga() {
    const chan = channel()

    try {
      for (var i = 0; i < 3; i++) {
        yield fork(worker, i + 1, chan)
      }

      while (true) {
        const { payload } = yield take('ACTION')
        yield put(chan, payload)
      }
    } finally {
      chan.close()
    }
  }

  function* worker(idx, chan) {
    let count = 0

    while (true) {
      actual.push([idx, yield take(chan)]) // 1st worker will 'sleep' after taking 2 messages on the 1st round

      if (idx === 1 && ++count === 2) {
        yield Promise.resolve()
      }
    }
  }

  const taskP = middleware.run(saga).toPromise()

  for (var i = 0; i < 10; i++) {
    store.dispatch({
      type: 'ACTION',
      payload: i + 1,
      round: 1,
    })
  }

  store.dispatch(END)

  return taskP.then(() => {
    // Saga must dispatch to free workers via channel
    expect(actual).toEqual([[1, 1], [2, 2], [3, 3], [1, 4], [2, 5], [3, 6], [2, 7], [3, 8], [2, 9], [3, 10]])
  })
})
