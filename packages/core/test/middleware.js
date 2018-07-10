import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { stdChannel } from '../src'
import { is } from '../src/utils'
import { takeEvery } from '../src/effects'

test('middleware output', assert => {
  const middleware = sagaMiddleware()

  assert.equal(
    typeof middleware,
    'function',
    'middleware factory must return a function to handle {getState, dispatch}',
  )

  assert.equal(middleware.length, 1, 'middleware returned function must take exactly 1 argument')

  const nextHandler = middleware({})

  assert.equal(typeof nextHandler, 'function', 'next handler must return a function to handle action')

  assert.equal(nextHandler.length, 1, 'next handler must take exactly 1 argument')

  const actionHandler = nextHandler()

  assert.equal(typeof actionHandler, 'function', 'next handler must return a function to handle action')

  assert.equal(actionHandler.length, 1, 'action handler must take exactly 1 argument')

  assert.end()
})

test("middleware's action handler output", assert => {
  const action = {}
  const actionHandler = sagaMiddleware()({})(action => action)

  assert.equal(actionHandler(action), action, 'action handler must return the result of the next argument')

  assert.end()
})

test('middleware.run', assert => {
  let actual

  function* saga(...args) {
    actual = args
  }

  const middleware = sagaMiddleware()

  try {
    middleware.run(function*() {})
  } catch (e) {
    assert.ok(
      e instanceof Error,
      'middleware.run must throw an Error when executed before the middleware is connected to a Store',
    )
  }

  createStore(() => {}, applyMiddleware(middleware))
  const task = middleware.run(saga, 'argument')

  assert.ok(is.task(task), 'middleware.run must return a Task Object')

  const expected = ['argument']
  assert.deepEqual(actual, expected, 'middleware must run the Saga and provides it with the given arguments')

  assert.end()
})

test('middleware options', assert => {
  try {
    sagaMiddleware({ onError: 42 })
  } catch (e) {
    assert.equal(
      e.message,
      'options.onError passed to the Saga middleware is not a function!',
      'middleware factory must raise an error if `options.onError` is not a function',
    )
  }

  const err = new Error('test')
  function* saga() {
    throw err
  }

  let actual
  const expected = err
  const options = { onError: err => (actual = err) }
  const middleware = sagaMiddleware(options)
  createStore(() => {}, applyMiddleware(middleware))
  middleware.run(saga)

  assert.equal(actual, expected, '`options.onError` is called appropriately')
  assert.end()
})

test('lift a channel with a custom emitter', assert => {
  const actual = []

  function* saga() {
    yield takeEvery('*', ac => actual.push(ac.type))
  }

  const emitter = emit => action => {
    if (action.type === 'batch') {
      action.batch.forEach(emit)
      return
    }
    emit(action)
  }
  const channel = stdChannel().lift(emitter)
  const middleware = sagaMiddleware({ channel })

  const store = createStore(() => {}, applyMiddleware(middleware))
  middleware.run(saga)

  store.dispatch({ type: 'a' })
  store.dispatch({
    type: 'batch',
    batch: [{ type: 'b' }, { type: 'c' }, { type: 'd' }],
  })
  store.dispatch({ type: 'e' })

  const expected = ['a', 'b', 'c', 'd', 'e']

  assert.deepEqual(actual, expected, 'channel could be lifted with a custom emitter')

  assert.end()
})

test('middleware.run saga arguments validation', assert => {
  assert.plan(1)

  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  try {
    middleware.run({})
  } catch (error) {
    assert.ok(/is not a function/.test(error.message), 'middleware.run must throw if not provided with an iterator')
  }

  try {
    middleware.run(function*() {})
  } catch (error) {
    assert.fail('middleware.run must not throw if provided with a generator')
  }

  assert.end()
})
