import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from 'redux-saga'
import { delay } from 'redux-saga/effects'
import { test, expect } from 'vitest'

import {
  errorInCallAsyncSaga,
  errorInCallInlineSaga,
  errorInForkSaga,
  errorInRaceSaga,
  errorInDelegateSaga,
  errorInRetrySaga,
  errorInPutSaga,
  errorInSelectSaga,
  funcExpressionSaga,
  primitiveErrorSaga,
} from '../src/sagas'

test('when run saga via sagaMiddleware errors are shown in logs', async () => {
  const middleware = sagaMiddleware({
    onError: function mute() {},
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInCallAsyncSaga).toPromise()).rejects.toThrow(
    'undefinedIsNotAFunction is not defined',
  )
})

test("when run generator manually errors aren't shown in logs", () => {
  const generator = errorInCallAsyncSaga()

  expect(generator.next().value).toEqual(delay(100))

  try {
    generator.next()
  } catch (e) {
    // just ignore errors to prevent tests from failing
  }
})

test('error in async call: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInCallAsyncSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInCallAsyncSaga  src/sagas/index.js?25\n',
  ]
  expect(actual).toEqual(expected)
})

test('error in inlined saga:shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInCallInlineSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task _callee  src/sagas/index.js?31\n    created by errorInCallInlineSaga  src/sagas/index.js?30\n',
  ]
  expect(actual).toEqual(expected)
})

test('error in fork:shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInForkSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInForkSaga  src/sagas/index.js?37\n',
  ]
  expect(actual).toEqual(expected)
})

test('error in race: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInRaceSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInRaceSaga  src/sagas/index.js?47\n',
  ]
  expect(actual).toEqual(expected)
})

test("error in delegated saga: doesn't show delegated in error stack", async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInDelegateSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInDelegateSaga  src/sagas/index.js?69\n',
  ]
  expect(actual).toEqual(expected)
})

test('error in helper: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInRetrySaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    // the helper's task name depends on whether redux-saga is consumed from its sources or from the bundle
    expect.stringMatching(
      /^The above error occurred in task retry(\$1)?\n {4}created by errorInRetrySaga {2}src\/sagas\/index\.js\?73\n$/,
    ),
  ]
  expect(actual).toEqual(expected)
})

test('error in select: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInSelectSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task errorInSelectSaga  src/sagas/index.js?11 \n when executing effect select(errorGeneratorSelector)  src/sagas/index.js?13\n',
  ]
  expect(actual).toEqual(expected)
})

test('error in put: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  function rootReducer(state = {}, action) {
    if (action.type === 'REDUCER_ACTION_ERROR_IN_PUT') throw new Error('error in put')
    return state
  }
  createStore(rootReducer, {}, applyMiddleware(middleware))

  await expect(middleware.run(errorInPutSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'error in put',
    "The above error occurred in task errorInPutSaga  src/sagas/index.js?6 \n when executing effect put({ type: 'REDUCER_ACTION_ERROR_IN_PUT' })  src/sagas/index.js?8\n",
  ]
  expect(actual).toEqual(expected)
})

test('error in functional expression saga: shows correct error logs with source of error', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })

  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(funcExpressionSaga).toPromise()).rejects.toBeDefined()

  const expected = [
    'undefinedIsNotAFunction is not defined',
    'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by functionExpressionSaga  src/sagas/index.js?79\n',
  ]
  expect(actual).toEqual(expected)
})

test('should return error stack if primitive is thrown', async () => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error, sagaStack)
    },
  })

  createStore(() => ({}), {}, applyMiddleware(middleware))

  await expect(middleware.run(primitiveErrorSaga).toPromise()).rejects.toBeDefined()

  const expected = ['error reason', 'The above error occurred in task primitiveErrorSaga  src/sagas/index.js?83\n']
  expect(actual).toEqual(expected)
})
