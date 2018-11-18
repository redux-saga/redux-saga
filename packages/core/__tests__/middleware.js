import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { stdChannel } from '../src'
import * as is from '@redux-saga/is'
import { put, takeEvery } from '../src/effects'

test('middleware output', () => {
  const middleware = sagaMiddleware() // middleware factory must return a function to handle {getState, dispatch}

  expect(typeof middleware).toBe('function') // middleware returned function must take exactly 1 argument

  expect(middleware.length).toBe(1)
  const nextHandler = middleware({}) // next handler must return a function to handle action

  expect(typeof nextHandler).toBe('function') // next handler must take exactly 1 argument

  expect(nextHandler.length).toBe(1)
  const actionHandler = nextHandler() // next handler must return a function to handle action

  expect(typeof actionHandler).toBe('function') // action handler must take exactly 1 argument

  expect(actionHandler.length).toBe(1)
})

test("middleware's action handler output", () => {
  const action = {}
  const actionHandler = sagaMiddleware()({})(action => action) // action handler must return the result of the next argument

  expect(actionHandler(action)).toBe(action)
})

test('middleware.run', () => {
  let actual

  function* saga(...args) {
    actual = args
  }

  const middleware = sagaMiddleware()

  try {
    middleware.run(function*() {})
  } catch (e) {
    // middleware.run must throw an Error when executed before the middleware is connected to a Store
    expect(e instanceof Error).toBe(true)
  }

  createStore(() => {}, applyMiddleware(middleware))
  const task = middleware.run(saga, 'argument') // middleware.run must return a Task Object

  expect(is.task(task)).toBe(true)
  const expected = ['argument'] // middleware must run the Saga and provides it with the given arguments

  expect(actual).toEqual(expected)
})

test('middleware options', () => {
  try {
    sagaMiddleware({
      onError: 42,
    })
  } catch (e) {
    // middleware factory must raise an error if `options.onError` is not a function
    expect(e.message).toBe('options.onError passed to the Saga middleware is not a function!')
  }

  const err = new Error('test')

  function* saga() {
    throw err
  }

  let actual
  const expected = err
  const options = {
    onError: err => (actual = err),
  }
  const middleware = sagaMiddleware(options)
  createStore(() => {}, applyMiddleware(middleware))
  middleware.run(saga) // `options.onError` is called appropriately

  expect(actual).toBe(expected)
})

test('enhance channel.put with an emitter', () => {
  const actual = []
  const channel = stdChannel()
  const rawPut = channel.put
  channel.put = action => {
    if (action.type === 'batch') {
      action.batch.forEach(rawPut)
      return
    }
    rawPut(action)
  }

  function* saga() {
    yield takeEvery(ac => ac.from !== 'saga', function*({ type }) {
      actual.push({ saga: true, got: type })
      yield put({ type: `pong_${type}`, from: 'saga' })
    })
    yield takeEvery(
      ac => ac.from === 'saga',
      ({ type }) => {
        actual.push({ saga: true, got: type })
      },
    )
  }

  let pastStoreCreation = false
  const rootReducer = (state, { type }) => {
    if (pastStoreCreation) {
      actual.push({ reducer: true, got: type })
    }

    return {}
  }

  const middleware = sagaMiddleware({ channel })
  const store = createStore(rootReducer, {}, applyMiddleware(middleware))
  pastStoreCreation = true

  middleware.run(saga)
  store.dispatch({ type: 'a' })
  store.dispatch({
    type: 'batch',
    batch: [{ type: 'b' }, { type: 'c' }],
  })
  store.dispatch({ type: 'd' })

  // saga must be able to take actions emitted by middleware's custom emitter
  const expected = [
    { reducer: true, got: 'a' },
    { saga: true, got: 'a' },
    { reducer: true, got: 'pong_a' },
    { saga: true, got: 'pong_a' },
    { reducer: true, got: 'batch' },
    { saga: true, got: 'b' },
    { reducer: true, got: 'pong_b' },
    { saga: true, got: 'pong_b' },
    { saga: true, got: 'c' },
    { reducer: true, got: 'pong_c' },
    { saga: true, got: 'pong_c' },
    { reducer: true, got: 'd' },
    { saga: true, got: 'd' },
    { reducer: true, got: 'pong_d' },
    { saga: true, got: 'pong_d' },
  ]
  expect(actual).toEqual(expected)
})

test('middleware.run saga arguments validation', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  expect(() => middleware.run({})).toThrow('saga argument must be a Generator function')

  expect(() => middleware.run(function* saga() {})).not.toThrow()
})
