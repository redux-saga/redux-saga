import { call } from '../../src/effects'
import { createStore } from 'redux'
import createSagaMiddleware from '../../src'

describe('Stack Overflow Prevention', () => {
  let store
  let sagaMiddleware
  let actualCallCount
  let callAttempts

  beforeEach(() => {
    actualCallCount = 0
    callAttempts = 10000 // Test with original large number
    sagaMiddleware = createSagaMiddleware()
    store = createStore(() => ({}), sagaMiddleware)
  })

  function genFnChild() {
    actualCallCount++
  }

  function* genFnParent() {
    for (let i = 0; i < callAttempts; i++) {
      yield call(genFnChild)
    }
  }

  it('should handle synchronous operations without stack overflow', (done) => {
    const task = sagaMiddleware.run(genFnParent)

    task
      .toPromise()
      .then(() => {
        expect(actualCallCount).toBe(callAttempts)
        done()
      })
      .catch(done)
  }, 10000) // Increase timeout
})
