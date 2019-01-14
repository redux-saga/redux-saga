import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { detach } from '../../src'
import * as io from '../../src/effects'
test('saga sync fork failures: functions', () => {
  let actual = []
  const middleware = sagaMiddleware({
    onError: err => {
      expect(err).toBe('immediatelyFailingFork')
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware)) // NOTE: we'll be forking a function not a Generator

  function immediatelyFailingFork() {
    throw 'immediatelyFailingFork'
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(immediatelyFailingFork)
      actual.push('success parent')
    } catch (e) {
      actual.push('parent caught ' + e)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.call(genParent)
      actual.push('success main')
    } catch (e) {
      actual.push('main caught ' + e)
    }
  }

  const task = middleware.run(main)
  const expected = ['start main', 'start parent', 'main caught immediatelyFailingFork']
  return task.toPromise().then(() => {
    // saga should fails the parent if a forked function fails synchronously
    expect(actual).toEqual(expected)
  })
})
test('saga sync fork failures: functions/error bubbling', () => {
  let actual = []
  const middleware = sagaMiddleware({
    onError: err => {
      expect(err.message).toMatchInlineSnapshot(`"immediatelyFailingFork"`)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware)) // NOTE: we'll be forking a function not a Generator

  function immediatelyFailingFork() {
    throw new Error('immediatelyFailingFork')
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(immediatelyFailingFork)
      actual.push('success parent')
    } catch (e) {
      actual.push('parent caught ' + e.message)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.fork(genParent)
      actual.push('success main')
    } catch (e) {
      actual.push('main caught ' + e.message)
    }
  }

  const task = middleware.run(main)
  const expected = ['start main', 'start parent', 'uncaught immediatelyFailingFork']
  return task
    .toPromise()
    .catch(err => {
      actual.push('uncaught ' + err.message)
    })
    .then(() => {
      // saga should propagate errors up to the root of fork tree
      expect(actual).toEqual(expected)
    })
})
test("saga fork's failures: generators", () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genChild() {
    throw 'gen error'
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(genChild)
      actual.push('success parent')
    } catch (e) {
      actual.push('parent caught ' + e)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.call(genParent)
      actual.push('success main')
    } catch (e) {
      actual.push('main caught ' + e)
    }
  }

  const task = middleware.run(main)
  const expected = ['start main', 'start parent', 'main caught gen error']
  return task.toPromise().then(() => {
    // saga should fails the parent if a forked generator fails synchronously
    expect(actual).toEqual(expected)
  })
})
test('saga sync fork failures: spawns (detached forks)', () => {
  let actual = []
  const middleware = sagaMiddleware({
    onError: err => {
      expect(err.message).toBe('gen error')
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* genChild() {
    throw new Error('gen error')
  }

  function* main() {
    try {
      actual.push('start main')
      const task = yield io.spawn(genChild)
      actual.push('spawn ' + task.meta.name)
      actual.push('success parent')
    } catch (e) {
      actual.push('main caught ' + e.message)
    }
  }

  const task = middleware.run(main)
  const expected = ['start main', 'spawn genChild', 'success parent']
  return task.toPromise().then(() => {
    // saga should not fail a parent with errors from detached forks (using spawn)
    expect(actual).toEqual(expected)
  })
})
test('saga detached forks failures', done => {
  const actual = []
  const middleware = sagaMiddleware({
    onError: err => actual.push(err),
  })
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const ACTION_TYPE = 'ACTION_TYPE'
  const ACTION_TYPE2 = 'ACTION_TYPE2'
  const failError = new Error('fail error')

  function willFail(ac) {
    if (!ac.fail) {
      actual.push(ac.i)
      return
    }

    throw failError
  }

  const wontFail = ac => actual.push(ac.i)

  function* saga() {
    yield detach(io.takeEvery(ACTION_TYPE, willFail))
    yield io.takeEvery(ACTION_TYPE2, wontFail)
  }

  middleware
    .run(saga)
    .toPromise()
    .catch(err => done.fail(err))

  const expected = [0, 1, 2, failError, 4]
  return Promise.resolve()
    .then(() =>
      store.dispatch({
        type: ACTION_TYPE,
        i: 0,
      }),
    )
    .then(() =>
      store.dispatch({
        type: ACTION_TYPE,
        i: 1,
      }),
    )
    .then(() =>
      store.dispatch({
        type: ACTION_TYPE,
        i: 2,
      }),
    )
    .then(() =>
      store.dispatch({
        type: ACTION_TYPE,
        i: 3,
        fail: true,
      }),
    )
    .then(() =>
      store.dispatch({
        type: ACTION_TYPE2,
        i: 4,
      }),
    )
    .then(() => {
      // saga should not fail a parent with errors from detached fork
      expect(actual).toEqual(expected)
      done()
    })
})
