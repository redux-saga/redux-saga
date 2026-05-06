import { createStore, applyMiddleware } from 'redux'
import { TASK_CANCEL } from '@redux-saga/symbols'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'

test('saga handles many synchronous call effects without getting stuck', () => {
  const callAttempts = 10000
  let actualCallCount = 0
  let timeoutId

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* root() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.call(syncCall)
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga did not complete after ${actualCallCount} synchronous call effects`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualCallCount).toBe(callAttempts)
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga handles a long synchronous call chain after an asynchronous boundary', () => {
  const callAttempts = 10000
  let actualCallCount = 0
  let timeoutId

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* root() {
    yield Promise.resolve()
    for (let i = 0; i < callAttempts; i++) {
      yield io.call(syncCall)
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga did not complete after ${actualCallCount} post-async synchronous call effects`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualCallCount).toBe(callAttempts)
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga handles many plain synchronous yielded values without getting stuck', () => {
  const loopCount = 5
  const addUpTo = 10000
  const expectedTotal = (addUpTo * (addUpTo + 1)) / 2
  const actualTotals = []
  let timeoutId

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* root() {
    for (let i = 0; i < loopCount; i++) {
      let total = 0
      for (let k = 1; k <= addUpTo; k++) {
        total = yield k + total
      }
      actualTotals.push(total)
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga did not complete after ${actualTotals.length} plain synchronous loops`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualTotals).toEqual(Array(loopCount).fill(expectedTotal))
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga catches and continues after a synchronous call error in a long chain', () => {
  const callAttemptsBeforeThrow = 5000
  const callAttemptsAfterThrow = 5000
  const expectedError = new Error('sync call failure')
  let actualCallCountBeforeThrow = 0
  let actualCallCountAfterThrow = 0
  let caughtError
  let onErrorCalls = 0
  let timeoutId

  const middleware = sagaMiddleware({
    onError: () => {
      onErrorCalls += 1
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCallBeforeThrow() {
    actualCallCountBeforeThrow += 1
  }

  function syncCallAfterThrow() {
    actualCallCountAfterThrow += 1
  }

  function failSyncCall() {
    throw expectedError
  }

  function* root() {
    try {
      for (let i = 0; i < callAttemptsBeforeThrow; i++) {
        yield io.call(syncCallBeforeThrow)
      }
      yield io.call(failSyncCall)
    } catch (error) {
      caughtError = error
    }

    for (let i = 0; i < callAttemptsAfterThrow; i++) {
      yield io.call(syncCallAfterThrow)
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga did not continue after catching a synchronous call error`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualCallCountBeforeThrow).toBe(callAttemptsBeforeThrow)
      expect(caughtError).toBe(expectedError)
      expect(actualCallCountAfterThrow).toBe(callAttemptsAfterThrow)
      expect(onErrorCalls).toBe(0)
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga handles self cancellation in a long synchronous call chain', () => {
  const callAttemptsBeforeCancel = 5000
  let actualCallCount = 0
  let didRunFinally = false

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* root() {
    try {
      for (let i = 0; i < callAttemptsBeforeCancel; i++) {
        yield io.call(syncCall)
      }
      yield io.cancel()
      yield io.call(syncCall)
    } finally {
      if (yield io.cancelled()) {
        didRunFinally = true
      }
    }
  }

  const task = middleware.run(root)

  return task.toPromise().then((result) => {
    expect(result).toBe(TASK_CANCEL)
    expect(task.isCancelled()).toBe(true)
    expect(actualCallCount).toBe(callAttemptsBeforeCancel)
    expect(didRunFinally).toBe(true)
  })
})

test('saga cancels a child after a long synchronous prefix', () => {
  const callAttemptsBeforeTake = 5000
  let actualCallCount = 0
  let didRunFinally = false

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* child() {
    try {
      for (let i = 0; i < callAttemptsBeforeTake; i++) {
        yield io.call(syncCall)
      }
      yield io.take('NEVER')
    } finally {
      if (yield io.cancelled()) {
        didRunFinally = true
      }
    }
  }

  function* root() {
    const task = yield io.fork(child)
    yield io.cancel(task)
  }

  return middleware
    .run(root)
    .toPromise()
    .then(() => {
      expect(actualCallCount).toBe(callAttemptsBeforeTake)
      expect(didRunFinally).toBe(true)
    })
})

test('saga rejects when a generator throws inside a long synchronous call chain', () => {
  const expectedError = new Error('sync chain failure')
  const callAttemptsBeforeThrow = 5000
  let actualCallCount = 0

  const middleware = sagaMiddleware({
    onError: (error) => {
      expect(error).toBe(expectedError)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* root() {
    for (let i = 0; i < callAttemptsBeforeThrow; i++) {
      yield io.call(syncCall)
    }
    throw expectedError
  }

  return expect(middleware.run(root).toPromise())
    .rejects.toBe(expectedError)
    .then(() => {
      expect(actualCallCount).toBe(callAttemptsBeforeThrow)
    })
})

test('saga handles a called sub-saga with many synchronous call effects', () => {
  const callAttempts = 10000
  let actualCallCount = 0

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncCall() {
    actualCallCount += 1
  }

  function* subSaga() {
    for (let i = 0; i < callAttempts; i++) {
      yield io.call(syncCall)
    }
    return actualCallCount
  }

  function* root() {
    return yield io.call(subSaga)
  }

  return middleware
    .run(root)
    .toPromise()
    .then((result) => {
      expect(result).toBe(callAttempts)
      expect(actualCallCount).toBe(callAttempts)
    })
})

test('saga handles repeated all effects that synchronously fail and cancel pending siblings', () => {
  const iterations = 2000
  const expectedError = new Error('all failure')
  let actualCaughtCount = 0
  let onErrorCalls = 0
  let timeoutId

  const middleware = sagaMiddleware({
    onError: () => {
      onErrorCalls += 1
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function failSyncCall() {
    throw expectedError
  }

  function* root() {
    for (let i = 0; i < iterations; i++) {
      try {
        yield io.all([io.take(`NEVER-${i}`), io.call(failSyncCall)])
      } catch (error) {
        if (error !== expectedError) {
          throw error
        }
        actualCaughtCount += 1
      }
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga caught ${actualCaughtCount} synchronous all failures before getting stuck`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualCaughtCount).toBe(iterations)
      expect(onErrorCalls).toBe(0)
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga handles many synchronous race winners while cancelling pending losers', () => {
  const iterations = 5000
  const actualResults = []
  let timeoutId

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function syncWinner(index) {
    return index
  }

  function* root() {
    for (let i = 0; i < iterations; i++) {
      actualResults.push(
        yield io.race({
          winner: io.call(syncWinner, i),
          loser: io.take(`NEVER-${i}`),
        }),
      )
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga completed ${actualResults.length} synchronous race effects before getting stuck`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualResults).toHaveLength(iterations)
      for (let i = 0; i < iterations; i++) {
        expect(actualResults[i]).toEqual({ winner: i })
      }
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga handles many synchronous fork effects without getting stuck', () => {
  const forkAttempts = 10000
  let actualForkCount = 0
  let timeoutId

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    actualForkCount += 1
  }

  function* root() {
    for (let i = 0; i < forkAttempts; i++) {
      yield io.fork(child)
    }
  }

  const task = middleware.run(root)
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Saga did not complete after ${actualForkCount} synchronous fork effects`))
      task.cancel()
    }, 1000)
  })

  return Promise.race([task.toPromise(), timeout])
    .then(() => {
      expect(actualForkCount).toBe(forkAttempts)
    })
    .finally(() => {
      clearTimeout(timeoutId)
    })
})

test('saga preserves deeply nested fork/put ordering in a synchronous loop', () => {
  const iterations = 1500
  const actual = []

  const middleware = sagaMiddleware()
  createStore(() => {}, applyMiddleware(middleware))

  function* s1(index) {
    yield io.fork(s2, index)
    actual.push(yield io.take(`a2-${index}`))
  }

  function* s2(index) {
    yield io.fork(s3, index)
    actual.push(yield io.take(`a3-${index}`))
    yield io.put({
      type: `a2-${index}`,
    })
  }

  function* s3(index) {
    yield io.put({
      type: `a3-${index}`,
    })
  }

  function* root() {
    for (let i = 0; i < iterations; i++) {
      yield io.call(s1, i)
    }
  }

  return middleware
    .run(root)
    .toPromise()
    .then(() => {
      expect(actual).toHaveLength(iterations * 2)
      for (let i = 0; i < iterations; i++) {
        expect(actual[i * 2]).toEqual({ type: `a3-${i}` })
        expect(actual[i * 2 + 1]).toEqual({ type: `a2-${i}` })
      }
    })
})
