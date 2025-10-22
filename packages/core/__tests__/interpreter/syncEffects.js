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
