import { applyMiddleware, createStore } from 'redux'
import sagaMiddleware from '../src'
import * as is from '@redux-saga/is'

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

test('middleware.run saga arguments validation', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  expect(() => middleware.run({})).toThrow('saga argument must be a Generator function')

  expect(() => middleware.run(function* saga() {})).not.toThrow()
})
