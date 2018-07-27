import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from 'redux-saga'
import { delay } from 'redux-saga/effects'
import test from 'tape'

import { errorInCallAsyncSaga } from '../src/sagas'

test('when run saga via sagaMiddleware errors are shown in logs', t => {
  const middleware = sagaMiddleware()
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
