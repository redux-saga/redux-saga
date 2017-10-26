import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import * as io from '../../src/effects'
import { deferred } from '../../src/utils'
import createSagaMiddleware, { channel, delay, END } from '../../src'

const thunk = () => next => action => {
  if (typeof action.then === 'function') {
    return action
  }
  next(action)
}

test('saga put handling', assert => {
  assert.plan(1)

  let actual = []

  const spy = () => next => action => {
    actual.push(action.type)
    next(action)
  }
  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(spy, sagaMiddleware)(createStore)(() => {})

  function* genFn(arg) {
    yield io.put({ type: arg })
    yield io.put({ type: 2 })
  }

  const task = sagaMiddleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must handle generator puts')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga put in a channel', assert => {
  assert.plan(1)

  const buffer = []
  const spyBuffer = {
    isEmpty: () => !buffer.length,
    put: it => buffer.push(it),
    take: () => buffer.shift(),
  }
  const chan = channel(spyBuffer)

  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(sagaMiddleware)(createStore)(() => {})

  function* genFn(arg) {
    yield io.put(chan, arg)
    yield io.put(chan, 2)
  }

  const task = sagaMiddleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(buffer, expected, 'saga must handle puts on a given channel')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga async put's response handling", assert => {
  assert.plan(1)

  let actual = []

  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(thunk, sagaMiddleware)(createStore)(() => {})

  function* genFn(arg) {
    actual.push(yield io.putResolve(Promise.resolve(arg)))
    actual.push(yield io.putResolve(Promise.resolve(2)))
  }

  const task = sagaMiddleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must handle async responses of generator put effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga error put's response handling", assert => {
  assert.plan(1)

  let actual = []
  const error = new Error('error')
  const reducer = (state, action) => {
    if (action.error) {
      throw error
    }
    return state
  }
  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(sagaMiddleware)(createStore)(reducer)

  function* genFn(arg) {
    try {
      yield io.put({ type: arg, error: true })
    } catch (err) {
      actual.push(err)
    }
  }

  const task = sagaMiddleware.run(genFn, 'arg')

  const expected = [error]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga should bubble thrown errors of generator put effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga error putResolve's response handling", assert => {
  assert.plan(1)

  let actual = []
  const reducer = state => state
  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(thunk, sagaMiddleware)(createStore)(reducer)

  function* genFn(arg) {
    try {
      actual.push(yield io.putResolve(Promise.reject(new Error('error ' + arg))))
    } catch (err) {
      actual.push(err.message)
    }
  }

  const task = sagaMiddleware.run(genFn, 'arg')

  const expected = ['error arg']

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must bubble thrown errors of generator putResolve effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga nested puts handling', assert => {
  assert.plan(1)

  let actual = []
  const sagaMiddleware = createSagaMiddleware()
  applyMiddleware(sagaMiddleware)(createStore)(() => {})

  function* genA() {
    yield io.put({ type: 'a' })
    actual.push('put a')
  }

  function* genB() {
    yield io.take('a')
    yield io.put({ type: 'b' })
    actual.push('put b')
  }

  function* root() {
    yield io.fork(genB) // forks genB first to be ready to take before genA starts putting
    yield io.fork(genA)
  }

  const expected = ['put a', 'put b']

  sagaMiddleware
    .run(root)
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must order nested puts by executing them after the outer puts complete')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('puts emitted while dispatching saga need not to cause stack overflow', assert => {
  function* root() {
    yield io.put({ type: 'put a lot of actions' })
    yield io.call(delay, 0)
  }

  assert.plan(1)
  const reducer = (state, action) => action.type
  const sagaMiddleware = createSagaMiddleware({
    emitter: emit => () => {
      for (var i = 0; i < 32768; i++) {
        emit({ type: 'test' })
      }
    },
  })
  const store = createStore(reducer, applyMiddleware(sagaMiddleware))

  store.subscribe(() => {})

  const task = sagaMiddleware.run(root)

  task.toPromise().then(() => {
    assert.ok(true, 'this saga needs to run without stack overflow')
    assert.end()
  })
})

test('puts emitted directly after creating a task (caused by another put) should not be missed by that task', assert => {
  assert.plan(1)
  const actual = []

  const rootReducer = (state, action) => {
    return { callSubscriber: action.callSubscriber }
  }

  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(rootReducer, undefined, applyMiddleware(sagaMiddleware))

  const saga = sagaMiddleware.run(function*() {
    yield io.take('a')
    yield io.put({ type: 'b', callSubscriber: true })
    yield io.take('c')
    yield io.fork(function*() {
      yield io.take('do not miss')
      actual.push("didn't get missed")
    })
  })

  store.subscribe(() => {
    if (store.getState().callSubscriber) {
      store.dispatch({ type: 'c' })
      store.dispatch({ type: 'do not miss' })
    }
  })

  store.dispatch({ type: 'a' })

  const expected = ["didn't get missed"]
  saga.toPromise().then(() => {
    assert.deepEqual(actual, expected)
  })
})

test('END should reach tasks created after it gets dispatched', assert => {
  assert.plan(1)
  const actual = []

  const rootReducer = () => ({})

  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(rootReducer, undefined, applyMiddleware(sagaMiddleware))

  function* subTask() {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        actual.push('subTask taking END')
        yield io.take('NEXT')
        actual.push('should not get here')
      }
    } finally {
      actual.push('auto ended')
    }
  }

  const def = deferred()

  const rootSaga = sagaMiddleware.run(function*() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      yield io.take('START')
      actual.push('start taken')
      yield def.promise
      actual.push('non-take effect resolved')
      yield io.fork(subTask)
      actual.push('subTask forked')
    }
  })

  Promise.resolve()
    .then(() => {
      store.dispatch({ type: 'START' })
      store.dispatch(END)
    })
    .then(() => {
      def.resolve()
      store.dispatch({ type: 'NEXT' })
      store.dispatch({ type: 'START' })
    })

  const expected = ['start taken', 'non-take effect resolved', 'subTask taking END', 'auto ended', 'subTask forked']
  rootSaga.toPromise().then(() => {
    assert.deepEqual(actual, expected)
  })
})
