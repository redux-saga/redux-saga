import sagaMiddleware, { channel, END } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { debounce, cancel, take } from '../../src/effects'
import delayP from '@redux-saga/delay-p'

test('debounce: sync actions', () => {
  let called = 0
  const delayMs = 33
  const largeDelayMs = delayMs + 100
  const actual = []
  const expected = [[1, 'c']]
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)

  function* saga() {
    const task = yield debounce(delayMs, 'ACTION', fnToCall)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* fnToCall(action) {
    called++
    actual.push([called, action.payload])
  }

  return Promise.resolve()
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: 'a',
      })
      store.dispatch({
        type: 'ACTION',
        payload: 'b',
      })
      store.dispatch({
        type: 'ACTION',
        payload: 'c',
      })
    })
    .then(() => delayP(largeDelayMs))
    .then(() =>
      store.dispatch({
        type: 'CANCEL_WATCHER',
      }),
    )
    .then(() => {
      // should debounce sync actions and pass the lastest action to a worker
      expect(actual).toEqual(expected)
    })
})
test('debounce: async actions', () => {
  let called = 0
  const delayMs = 30
  const smallDelayMs = delayMs - 10
  const largeDelayMs = delayMs + 10
  const actual = []
  const expected = [[1, 'c'], [2, 'd']]
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)

  function* saga() {
    const task = yield debounce(delayMs, 'ACTION', fnToCall)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* fnToCall(action) {
    called++
    actual.push([called, action.payload])
  }

  return Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'a',
      }),
    )
    .then(() => delayP(smallDelayMs))
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'b',
      }),
    )
    .then(() => delayP(smallDelayMs))
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'c',
      }),
    )
    .then(() => delayP(largeDelayMs))
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'd',
      }),
    )
    .then(() => delayP(largeDelayMs))
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'e',
      }),
    )
    .then(() => delayP(smallDelayMs))
    .then(() =>
      store.dispatch({
        type: 'CANCEL_WATCHER',
      }),
    )
    .then(() => {
      // should debounce async actions and pass the lastest action to a worker
      expect(actual).toEqual(expected)
    })
})
test('debounce: cancelled', () => {
  let called = 0
  const delayMs = 30
  const smallDelayMs = delayMs - 10
  const actual = []
  const expected = []
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)

  function* saga() {
    const task = yield debounce(delayMs, 'ACTION', fnToCall)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* fnToCall(action) {
    called++
    actual.push([called, action.payload])
  }

  return Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'ACTION',
        payload: 'a',
      }),
    )
    .then(() => delayP(smallDelayMs))
    .then(() =>
      store.dispatch({
        type: 'CANCEL_WATCHER',
      }),
    )
    .then(() => {
      // should not call a worker if cancelled before debounce limit is reached
      expect(actual).toEqual(expected)
    })
})
test('debounce: channel', () => {
  let called = 0
  const delayMs = 30
  const largeDelayMs = delayMs + 10
  const customChannel = channel()
  const actual = []
  const expected = [[1, 'c']]
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)

  function* saga() {
    const task = yield debounce(delayMs, customChannel, fnToCall)
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* fnToCall(dataFromChannel) {
    called++
    actual.push([called, dataFromChannel])
  }

  return Promise.resolve()
    .then(() => {
      customChannel.put('a')
      customChannel.put('b')
      customChannel.put('c')
    })
    .then(() => delayP(largeDelayMs))
    .then(() => {
      customChannel.put('d')
    })
    .then(() =>
      store.dispatch({
        type: 'CANCEL_WATCHER',
      }),
    )
    .then(() => {
      // should debounce actions from channel and pass the lastest action to a worker
      expect(actual).toEqual(expected)
    })
})
test('debounce: channel END', () => {
  let called = 0
  const delayMs = 30
  const smallDelayMs = delayMs - 10
  const customChannel = channel()
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)
  let task

  function* saga() {
    task = yield debounce(delayMs, customChannel, fnToCall)
  }

  function* fnToCall() {
    called++
  }

  return Promise.resolve()
    .then(() => delayP(smallDelayMs))
    .then(() => customChannel.put(END))
    .then(() => {
      // should finish debounce task on END
      expect(task.isRunning()).toBe(false) // should not call function if finished with END

      expect(called).toBe(0)
    })
})
test('debounce: pattern END', () => {
  let called = 0
  const delayMs = 30
  const smallDelayMs = delayMs - 10
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)
  let task

  function* saga() {
    task = yield debounce(delayMs, 'ACTION', fnToCall)
  }

  function* fnToCall() {
    called++
  }

  return Promise.resolve()
    .then(() => delayP(smallDelayMs))
    .then(() => store.dispatch(END))
    .then(() => {
      // should finish debounce task on END
      expect(task.isRunning()).toBe(false) // should not call function if finished with END

      expect(called).toBe(0)
    })
})
test('debounce: pattern END during race', () => {
  let called = 0
  const delayMs = 30
  const largeDelayMs = delayMs + 10
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  middleware.run(saga)
  let task

  function* saga() {
    task = yield debounce(delayMs, 'ACTION', fnToCall)
  }

  function* fnToCall() {
    called++
  }

  return Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'ACTION',
      }),
    )
    .then(() => store.dispatch(END))
    .then(() => delayP(largeDelayMs))
    .then(() =>
      store.dispatch({
        type: 'ACTION',
      }),
    )
    .then(() => delayP(largeDelayMs))
    .then(() => {
      // should interrupt race on END
      expect(called).toBe(0) // should finish debounce task on END

      expect(task.isRunning()).toBe(false)
    })
})
