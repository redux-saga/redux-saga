import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('saga escalates a stack overflow to the parent saga', () => {
  const callAttempts = 1500
  let actualCallCount = 0
  let didCatchInWrapper = false

  const rootReducer = () => ({})

  const middleware = sagaMiddleware()
  createStore(rootReducer, {}, applyMiddleware(middleware))

  function genFnChild() {
    actualCallCount++
  }

  function* genFnParent() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.call(genFnChild)
    }
  }

  function* genWrapper() {
    try {
      yield io.call(genFnParent)
    } catch (exc) {
      didCatchInWrapper = true
    }
  }

  const task = middleware.run(genWrapper)
  return task.toPromise().then(() => {
    expect(actualCallCount).toBeLessThan(callAttempts)
    expect(didCatchInWrapper).toBe(true)
  })
})
