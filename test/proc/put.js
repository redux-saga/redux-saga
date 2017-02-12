import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import * as io from '../../src/effects'
import * as utils from '../../src/internal/utils'
import { channel } from '../../src/internal/channel'
import sagaMiddleware from '../../src'

const thunk = () => next => action => {
  if (typeof action.then === 'function') {
    return action
  }
  next(action)
}

test('proc put handling', assert => {
  assert.plan(1)

  let actual = []

  const spy = () => next => action => {
    actual.push(action.type)
    next(action)
  }
  const middleware = sagaMiddleware()
  applyMiddleware(spy, middleware)(createStore)(() => {})

  function* genFn(arg) {
    yield io.put({ type: arg })
    yield io.put({ type: 2 })
  }

  const task = middleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task.done
    .then(() => {
      assert.deepEqual(actual, expected, 'proc must handle generator puts')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('proc put in a channel', assert => {
  assert.plan(1)

  const buffer = []
  const spyBuffer = {
    isEmpty: () => !buffer.length,
    put: it => buffer.push(it),
    take: () => buffer.shift(),
  }
  const chan = channel(spyBuffer)

  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn(arg) {
    yield io.put(chan, arg)
    yield io.put(chan, 2)
  }

  const task = middleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task.done
    .then(() => {
      assert.deepEqual(buffer, expected, 'proc must handle puts on a given channel')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("proc async put's response handling", assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  applyMiddleware(thunk, middleware)(createStore)(() => {})

  function* genFn(arg) {
    actual.push(yield io.put.resolve(Promise.resolve(arg)))
    actual.push(yield io.put.resolve(Promise.resolve(2)))
  }

  const task = middleware.run(genFn, 'arg')

  const expected = ['arg', 2]

  task.done
    .then(() => {
      assert.deepEqual(actual, expected, 'proc must handle async responses of generator put effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("proc error put's response handling", assert => {
  assert.plan(1)

  let actual = []
  const error = new Error('error')
  const reducer = (state, action) => {
    if (action.error) {
      throw error
    }
    return state
  }
  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(reducer)

  function* genFn(arg) {
    try {
      yield io.put({ type: arg, error: true })
    } catch (err) {
      actual.push(err)
    }
  }

  const task = middleware.run(genFn, 'arg')

  const expected = [error]

  task.done
    .then(() => {
      assert.deepEqual(actual, expected, 'proc should bubble thrown errors of generator put effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("proc error put.resolve's response handling", assert => {
  assert.plan(1)

  let actual = []
  const reducer = state => state
  const middleware = sagaMiddleware()
  applyMiddleware(thunk, middleware)(createStore)(reducer)

  function* genFn(arg) {
    try {
      actual.push(yield io.put.resolve(Promise.reject(new Error('error ' + arg))))
    } catch (err) {
      actual.push(err.message)
    }
  }

  const task = middleware.run(genFn, 'arg')

  const expected = ['error arg']

  task.done
    .then(() => {
      assert.deepEqual(actual, expected, 'proc must bubble thrown errors of generator put.resolve effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('proc nested puts handling', assert => {
  assert.plan(1)

  let actual = []
  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

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

  middleware
    .run(root)
    .done.then(() => {
      assert.deepEqual(actual, expected, 'proc must order nested puts by executing them after the outer puts complete')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('puts emitted while dispatching saga need not to cause stack overflow', assert => {
  function* root() {
    yield io.put({ type: 'put a lot of actions' })
    yield io.call(utils.delay, 0)
  }

  assert.plan(1)
  const reducer = (state, action) => action.type
  const middleware = sagaMiddleware({
    emitter: emit => () => {
      for (var i = 0; i < 32768; i++) {
        emit({ type: 'test' })
      }
    },
  })
  const store = createStore(reducer, applyMiddleware(middleware))

  store.subscribe(() => {})

  middleware.run(root)

  setTimeout(() => {
    assert.ok(true, 'this saga needs to run without stack overflow')
    assert.end()
  })
})
