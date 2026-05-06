import { createStore, applyMiddleware } from 'redux'
import { TASK_CANCEL } from '@redux-saga/symbols'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('succeeds on a long synchronous loop through call effects', () => {
  const attempts = 1500
  let actualCallCount = 0
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function sync() {
    actualCallCount++
  }

  function* worker() {
    for (let i = 0; i < attempts; i++) {
      yield io.call(sync)
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actualCallCount).toBe(attempts)
    })
})

test('succeeds on a long synchronous loop through call effects after async resolution', () => {
  const attempts = 1500
  let actualCallCount = 0
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function sync() {
    actualCallCount++
  }

  function* worker() {
    yield Promise.resolve()

    for (let i = 0; i < attempts; i++) {
      yield io.call(sync)
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actualCallCount).toBe(attempts)
    })
})

test('succeeds on a long synchronous loop through fork effects', () => {
  const attempts = 1500
  let actualCallCount = 0
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    actualCallCount++
  }

  function* worker() {
    for (let i = 0; i < attempts; i++) {
      yield io.fork(child)
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actualCallCount).toBe(attempts)
    })
})

test('succeeds on a long synchronous loop through fork effects after async resolution', () => {
  const attempts = 1500
  let actualCallCount = 0
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    actualCallCount++
  }

  function* worker() {
    yield Promise.resolve()

    for (let i = 0; i < attempts; i++) {
      yield io.fork(child)
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actualCallCount).toBe(attempts)
    })
})

test('succeeds on a long synchronous loop through put effects', () => {
  const attempts = 1500
  const rootReducer = (state, action) => {
    if (action.type === 'INC') {
      return {
        ...state,
        count: state.count + 1,
      }
    }

    return state
  }
  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { count: 0 }, applyMiddleware(middleware))

  function* worker() {
    for (let i = 0; i < attempts; i++) {
      yield io.put({ type: 'INC' })
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(store.getState().count).toBe(attempts)
    })
})

test('succeeds on a long synchronous loop through put effects after async resolution', () => {
  const attempts = 1500
  const rootReducer = (state, action) => {
    if (action.type === 'INC') {
      return {
        ...state,
        count: state.count + 1,
      }
    }

    return state
  }
  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { count: 0 }, applyMiddleware(middleware))

  function* worker() {
    yield Promise.resolve()

    for (let i = 0; i < attempts; i++) {
      yield io.put({ type: 'INC' })
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(store.getState().count).toBe(attempts)
    })
})

test('preserves ordering across nested forks with synchronous puts', () => {
  const depth = 8
  const actual = []
  const rootReducer = (state, action) => {
    if (action.type === 'DEPTH_ACTION') {
      return { ...state, maxDepth: Math.max(state.maxDepth || 0, action.depth) }
    }

    return state
  }
  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { maxDepth: 0 }, applyMiddleware(middleware))

  function* createDepthFork(currentDepth) {
    yield io.put({ type: 'DEPTH_ACTION', depth: currentDepth })
    actual.push(currentDepth)

    if (currentDepth < depth) {
      yield io.fork(createDepthFork, currentDepth + 1)
    }
  }

  function* worker() {
    yield io.fork(createDepthFork, 1)
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actual).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
      expect(store.getState().maxDepth).toBe(depth)
    })
})

test('supports alternating synchronous put, call, and fork effects', () => {
  const iterations = 200
  const actual = []
  const rootReducer = (state, action) => {
    if (action.type === 'PUT_ACTION') {
      return { ...state, putCount: (state.putCount || 0) + 1 }
    }

    return state
  }
  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { putCount: 0 }, applyMiddleware(middleware))

  function* callTask(kind) {
    actual.push(kind)
  }

  function* worker() {
    for (let i = 0; i < iterations; i++) {
      yield io.put({ type: 'PUT_ACTION' })
      yield io.call(callTask, 'call')
      yield io.fork(callTask, 'fork')
    }
  }

  return middleware
    .run(worker)
    .toPromise()
    .then(() => {
      expect(actual).toHaveLength(iterations * 2)
      expect(store.getState().putCount).toBe(iterations)
    })
})

test('processes cancellation requested during a synchronous call loop', () => {
  const cancelAt = 750
  const actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  let task

  function sync(i) {
    actual.push(i)

    if (i === cancelAt) {
      task.cancel()
    }
  }

  function* worker() {
    yield Promise.resolve()

    try {
      for (let i = 0; i < 1500; i++) {
        yield io.call(sync, i)
      }
    } finally {
      if (yield io.cancelled()) {
        actual.push('cancelled')
      }
    }
  }

  task = middleware.run(worker)

  return task.toPromise().then((result) => {
    expect(result).toBe(TASK_CANCEL)
    expect(actual.slice(0, 5)).toEqual([0, 1, 2, 3, 4])
    expect(actual[actual.length - 2]).toBe(1499)
    expect(actual[actual.length - 1]).toBe('cancelled')
    expect(actual).toHaveLength(1501)
  })
})

test('propagates synchronous errors after an async boundary without over-running the loop', () => {
  const throwAt = 900
  const actual = []
  const expectedError = new Error('sync failure')
  const middleware = sagaMiddleware({ onError: () => {} })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function sync(i) {
    if (i === throwAt) {
      throw expectedError
    }

    actual.push(i)
  }

  function* worker() {
    yield Promise.resolve()

    for (let i = 0; i < 1500; i++) {
      yield io.call(sync, i)
    }
  }

  return expect(middleware.run(worker).toPromise())
    .rejects.toBe(expectedError)
    .then(() => {
      expect(actual).toHaveLength(throwAt)
      expect(actual[actual.length - 1]).toBe(throwAt - 1)
    })
})
