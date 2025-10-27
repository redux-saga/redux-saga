import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('suceeds on a long synchronous loop through call effects', () => {
  const callAttempts = 1500
  let actualCallCount = 0

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function sync() {
    actualCallCount++
  }

  function* genFnParent() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.call(sync)
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualCallCount).toBe(callAttempts)
  })
})

test('suceeds on a long synchronous loop through call effects after async resolution', () => {
  const callAttempts = 1500
  let actualCallCount = 0

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function sync() {
    actualCallCount++
  }

  function* genFnParent() {
    yield Promise.resolve()

    for (let i = 0; i < callAttempts; i++) {
      yield io.call(sync)
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualCallCount).toBe(callAttempts)
  })
})

test('suceeds on a long synchronous loop through fork effects', () => {
  const callAttempts = 1500
  let actualCallCount = 0

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function* genFnChild() {
    actualCallCount++
  }

  function* genFnParent() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.fork(genFnChild)
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualCallCount).toBe(callAttempts)
  })
})

test('suceeds on a long synchronous loop through fork effects after async resolution', () => {
  const callAttempts = 1500
  let actualCallCount = 0

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function* genFnChild() {
    actualCallCount++
  }

  function* genFnParent() {
    yield Promise.resolve()

    for (let i = 0; i < callAttempts; i++) {
      yield io.fork(genFnChild)
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualCallCount).toBe(callAttempts)
  })
})

test('suceeds on a long synchronous loop through put effects', () => {
  const callAttempts = 1500

  const rootReducer = (state, action) => {
    switch (action.type) {
      case 'INC':
        return {
          ...state,
          callCount: state.callCount + 1,
        }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { callCount: 0 }, applyMiddleware(middleware))

  function* genFnParent() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.put({ type: 'INC' })
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(store.getState().callCount).toBe(callAttempts)
  })
})

test('suceeds on a long synchronous loop through put effects after async resolution', () => {
  const callAttempts = 1500

  const rootReducer = (state, action) => {
    switch (action.type) {
      case 'INC':
        return {
          ...state,
          callCount: state.callCount + 1,
        }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { callCount: 0 }, applyMiddleware(middleware))

  function* genFnParent() {
    yield Promise.resolve()

    for (let i = 0; i < callAttempts; i++) {
      yield io.put({ type: 'INC' })
    }
  }

  function* genWrapper() {
    yield io.call(genFnParent)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(store.getState().callCount).toBe(callAttempts)
  })
})

test('succeeds on deep nested fork effects', () => {
  const depth = 10
  let actualDepth = 0

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function* createNestedFork(currentDepth) {
    if (currentDepth < depth) {
      yield io.fork(createNestedFork, currentDepth + 1)
    } else {
      actualDepth = currentDepth
    }
  }

  function* genWrapper() {
    yield io.fork(createNestedFork, 1)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualDepth).toBe(depth)
  })
})

test('succeeds on fork effects with puts at different levels', () => {
  const actual = []
  const depth = 5

  const rootReducer = (state, action) => {
    if (action.type === 'LEVEL') {
      return { ...state, level: action.payload }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { level: 0 }, applyMiddleware(middleware))

  function* createForkWithPut(currentDepth) {
    yield io.put({ type: 'LEVEL', payload: currentDepth })
    actual.push(currentDepth)

    if (currentDepth < depth) {
      yield io.fork(createForkWithPut, currentDepth + 1)
    }
  }

  function* genWrapper() {
    yield io.fork(createForkWithPut, 1)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actual).toEqual([1, 2, 3, 4, 5])
    expect(store.getState().level).toBe(depth)
  })
})

test('succeeds on mixed fork and put effects in sequence', () => {
  const actual = []
  const iterations = 100

  const rootReducer = (state, action) => {
    if (action.type === 'COUNT') {
      return { ...state, count: (state.count || 0) + 1 }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { count: 0 }, applyMiddleware(middleware))

  function* childTask() {
    actual.push('child')
  }

  function* mixedEffects() {
    for (let i = 0; i < iterations; i++) {
      yield io.put({ type: 'COUNT' })
      yield io.fork(childTask)
    }
  }

  function* genWrapper() {
    yield io.call(mixedEffects)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actual).toHaveLength(iterations)
    expect(store.getState().count).toBe(iterations)
  })
})

test('succeeds on fork effects with immediate puts from children', () => {
  const actual = []
  const childCount = 50

  const rootReducer = (state, action) => {
    if (action.type === 'CHILD_ACTION') {
      return { ...state, actions: (state.actions || 0) + 1 }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { actions: 0 }, applyMiddleware(middleware))

  function* childWithPut() {
    yield io.put({ type: 'CHILD_ACTION' })
    actual.push('child-executed')
  }

  function* parentWithManyChildren() {
    for (let i = 0; i < childCount; i++) {
      yield io.fork(childWithPut)
    }
  }

  function* genWrapper() {
    yield io.fork(parentWithManyChildren)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actual).toHaveLength(childCount)
    expect(store.getState().actions).toBe(childCount)
  })
})

test('succeeds on deeply nested fork with puts at each level', () => {
  const actual = []
  const depth = 8

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

  function* genWrapper() {
    yield io.fork(createDepthFork, 1)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actual).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(store.getState().maxDepth).toBe(depth)
  })
})

test('succeeds on fork effects with alternating puts and calls', () => {
  const actual = []
  const iterations = 200

  const rootReducer = (state, action) => {
    if (action.type === 'PUT_ACTION') {
      return { ...state, putCount: (state.putCount || 0) + 1 }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, { putCount: 0 }, applyMiddleware(middleware))

  function* callTask() {
    actual.push('call')
  }

  function* alternatingEffects() {
    for (let i = 0; i < iterations; i++) {
      yield io.put({ type: 'PUT_ACTION' })
      yield io.call(callTask)
      yield io.fork(callTask)
    }
  }

  function* genWrapper() {
    yield io.call(alternatingEffects)
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actual).toHaveLength(iterations * 2) // call + fork for each iteration
    expect(store.getState().putCount).toBe(iterations)
  })
})
