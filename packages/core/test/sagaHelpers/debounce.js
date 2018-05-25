import test from 'tape'
import sagaMiddleware, {channel, END} from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { debounce, cancel, take } from '../../src/effects'
import { delay } from '../../src/internal/utils'

test('debounce: sync actions', assert => {
  assert.plan(1)

  let called = 0

  const delayMs = 30
  const largeDelayMs = delayMs + 10

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

  Promise.resolve()
    .then(() => {
      store.dispatch({ type: 'ACTION', payload: 'a' })
      store.dispatch({ type: 'ACTION', payload: 'b' })
      store.dispatch({ type: 'ACTION', payload: 'c' })
    })
    .then(() => delay(largeDelayMs))

    .then(() => store.dispatch({ type: 'CANCEL_WATCHER' }))
    .then(() => {
      assert.deepEqual(actual, expected, 'should debounce sync actions and pass the lastest action to a worker')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: async actions', assert => {
  assert.plan(1)

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

  Promise.resolve()
    .then(() => store.dispatch({ type: 'ACTION', payload: 'a' }))
    .then(() => delay(smallDelayMs))

    .then(() => store.dispatch({ type: 'ACTION', payload: 'b' }))
    .then(() => delay(smallDelayMs))

    .then(() => store.dispatch({ type: 'ACTION', payload: 'c' }))
    .then(() => delay(largeDelayMs))

    .then(() => store.dispatch({ type: 'ACTION', payload: 'd' }))
    .then(() => delay(largeDelayMs))

    .then(() => store.dispatch({ type: 'ACTION', payload: 'e' }))
    .then(() => delay(smallDelayMs))

    .then(() => store.dispatch({ type: 'CANCEL_WATCHER' }))
    .then(() => {
      assert.deepEqual(actual, expected, 'should debounce async actions and pass the lastest action to a worker')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: cancelled', assert => {
  assert.plan(1)

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

  Promise.resolve()
    .then(() => store.dispatch({ type: 'ACTION', payload: 'a' }))
    .then(() => delay(smallDelayMs))

    .then(() => store.dispatch({ type: 'CANCEL_WATCHER' }))
    .then(() => {
      assert.deepEqual(actual, expected, 'should not call a worker if cancelled before debounce limit is reached')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: channel', assert => {
  assert.plan(1)

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

  Promise.resolve()
    .then(() => {
      customChannel.put('a')
      customChannel.put('b')
      customChannel.put('c')
    })
    .then(() => delay(largeDelayMs))
    .then(() => {
      customChannel.put('d')
    })

    .then(() => store.dispatch({ type: 'CANCEL_WATCHER' }))
    .then(() => {
      assert.deepEqual(actual, expected, 'should debounce actions from channel and pass the lastest action to a worker')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: channel END', assert => {
  assert.plan(2)

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

  Promise.resolve()
    .then(() => delay(smallDelayMs))
    .then(() => customChannel.put(END))
    .then(() => {
      assert.equal(task.isRunning(), false, 'should finish debounce task on END')
      assert.equal(called, 0, 'should not call function if finished with END')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: pattern END', assert => {
  assert.plan(2)

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

  Promise.resolve()
    .then(() => delay(smallDelayMs))
    .then(() => store.dispatch(END))
    .then(() => {
      assert.equal(task.isRunning(), false, 'should finish debounce task on END')
      assert.equal(called, 0, 'should not call function if finished with END')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('debounce: pattern END during race', assert => {
  assert.plan(2)

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

  Promise.resolve()
    .then(() => store.dispatch({type: 'ACTION'}))
    .then(() => store.dispatch(END))
    .then(() => delay(largeDelayMs))

    .then(() => store.dispatch({type: 'ACTION'}))
    .then(() => delay(largeDelayMs))
    .then(() => {
      assert.equal(task.isRunning(), false, 'should finish debounce task on END')
      assert.equal(called, 1, 'should not call function on already finished channel')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
