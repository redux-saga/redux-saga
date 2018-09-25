import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from 'redux-saga'
import { delay } from 'redux-saga/effects'
import test from 'tape'

import { errorInCallAsyncSaga } from '../src/sagas'

test('when run saga via sagaMiddleware errors are shown in logs', t => {
  const middleware = sagaMiddleware({
    logger: function mute() {},
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

test('shows correct error logs with source of error', t => {
  const actual = []
  const middleware = sagaMiddleware({
    logger: (level, ...args) => {
      actual.push([level, args.join('')])
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  middleware
    .run(errorInCallAsyncSaga)
    .toPromise()
    .catch((/*error*/) => {
      const expected = [
        ['error', 'ReferenceError: undefinedIsNotAFunction is not defined'],
        [
          'error',
          'The above error occurred in task throwAnErrorSaga  src/sagas/index.js?16\n    created by errorInCallAsyncSaga  src/sagas/index.js?25\n',
        ],
      ]
      t.deepEqual(actual, expected)
      t.end()
    })
})
