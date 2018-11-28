import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from 'redux-saga'
import { delay } from 'redux-saga/effects'
import test from 'tape'

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

test('when run saga via sagaMiddleware errors are shown in logs', t => {
  const middleware = sagaMiddleware({
    onError: function mute() {},
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInCallAsyncSaga)
    .toPromise()
    .then(() => t.end())
    .catch((/*error*/) => t.end())
})

test("when run generator manually errors aren't shown in logs", t => {
  const generator = errorInCallAsyncSaga()

  t.deepEqual(generator.next().value, delay(100))

  try {
    generator.next()
  } catch (e) {
    // just ignore errors to prevent tests from failing
  }

  t.end()
})

test('error in async call: shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInCallAsyncSaga)
    .toPromise()
    .catch((/*error*/) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInCallAsyncSaga  src/sagas/index.js?25\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in inlined saga:shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInCallInlineSaga)
    .toPromise()
    .catch((/*error*/) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task _callee  src/sagas/index.js?31\n    created by errorInCallInlineSaga  src/sagas/index.js?30\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in fork:shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInForkSaga)
    .toPromise()
    .catch((/*error*/) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInForkSaga  src/sagas/index.js?37\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in race: shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInRaceSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInRaceSaga  src/sagas/index.js?47\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test("error in delegated saga: doesn't show delegated in error stack", t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInDelegateSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInDelegateSaga  src/sagas/index.js?69\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in helper: shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInRetrySaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task retry\n    created by errorInRetrySaga  src/sagas/index.js?73\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in select: shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInSelectSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task errorInSelectSaga  src/sagas/index.js?11 \n when executing effect select(errorGeneratorSelector)  src/sagas/index.js?13\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in put: shows correct error logs with source of error', t => {
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

  middleware
    .run(errorInPutSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'error in put',
        "The above error occurred in task errorInPutSaga  src/sagas/index.js?6 \n when executing effect put({ type: 'REDUCER_ACTION_ERROR_IN_PUT' })  src/sagas/index.js?8\n",
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('error in functional expression saga: shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error.message, sagaStack)
    },
  })

  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(funcExpressionSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = [
        'undefinedIsNotAFunction is not defined',
        'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by functionExpressionSaga  src/sagas/index.js?79\n',
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})

test('should return error stack if primitive is thrown', t => {
  const actual = []
  const middleware = sagaMiddleware({
    onError(error, { sagaStack }) {
      actual.push(error, sagaStack)
    },
  })

  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(primitiveErrorSaga)
    .toPromise()
    .catch((/* error */) => {
      const expected = ['error reason', 'The above error occurred in task primitiveErrorSaga  src/sagas/index.js?83\n']
      t.deepEqual(actual, expected)
      t.end()
    })
})
