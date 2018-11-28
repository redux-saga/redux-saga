/* eslint-disable no-constant-condition, no-undef, no-console, no-unused-vars */

import { retry, call, put, takeEvery, delay, all, race, fork, spawn, take, select } from 'redux-saga/effects'
import { errorGeneratorSelector } from '../reducers/'

export function* errorInPutSaga() {
  yield delay(100)
  yield put({ type: 'REDUCER_ACTION_ERROR_IN_PUT' })
}

export function* errorInSelectSaga() {
  yield delay(100)
  yield select(errorGeneratorSelector)
}

function* throwAnErrorSaga() {
  yield delay(100)
  undefinedIsNotAFunction()
}

export function errorInCallSyncSaga() {
  undefinedIsNotAFunction()
}

export function* errorInCallAsyncSaga() {
  yield delay(100)
  yield call(throwAnErrorSaga)
}

export function* errorInCallInlineSaga() {
  yield call(function*() {
    undefinedIsNotAFunction()
    yield 2
  })
}

export function* errorInForkSaga() {
  yield delay(100)
  yield fork(throwAnErrorSaga)
}

function* errorInSpawnSaga() {
  yield delay(100)
  yield spawn(throwAnErrorSaga)
}

export function* errorInRaceSaga() {
  yield delay(100)
  yield race({
    err: call(throwAnErrorSaga),
    ok: delay(100),
  })
}

function* caughtErrorSaga() {
  try {
    yield delay(100)
    yield call(throwAnErrorSaga)
  } catch (e) {
    console.error('error was caught', e)
  }
}

function* delegatedSaga() {
  yield delay(100)
  yield call(throwAnErrorSaga)
}

export function* errorInDelegateSaga() {
  yield* delegatedSaga()
}

export function* errorInRetrySaga() {
  yield retry(3, 10, function() {
    undefinedIsNotAFunction()
  })
}

export const funcExpressionSaga = function* functionExpressionSaga() {
  yield call(throwAnErrorSaga)
}

export function* primitiveErrorSaga() {
  yield delay(10)
  throw 'error reason'
}

export default function* rootSaga() {
  yield all([
    takeEvery('ACTION_ERROR_IN_PUT', errorInPutSaga),
    takeEvery('ACTION_ERROR_IN_SELECT', errorInSelectSaga),
    takeEvery('ACTION_ERROR_IN_CALL_SYNC', errorInCallSyncSaga),
    takeEvery('ACTION_ERROR_IN_CALL_ASYNC', errorInCallAsyncSaga),
    takeEvery('ACTION_ERROR_IN_CALL_INLINE', errorInCallInlineSaga),
    takeEvery('ACTION_ERROR_IN_FORK', errorInForkSaga),
    takeEvery('ACTION_ERROR_IN_SPAWN', errorInSpawnSaga),
    takeEvery('ACTION_ERROR_IN_RACE', errorInRaceSaga),
    takeEvery('ACTION_CAUGHT_ERROR', caughtErrorSaga),
    fork(function* inlinedSagaName() {
      while (true) {
        yield take('ACTION_INLINE_SAGA_ERROR')
        yield call(throwAnErrorSaga)
      }
    }),
    takeEvery('ACTION_IN_DELEGATE_ERROR', errorInDelegateSaga),
    takeEvery('ACTION_FUNCTION_EXPRESSION_ERROR', funcExpressionSaga),
    takeEvery('ACTION_ERROR_IN_RETRY', errorInRetrySaga),
    takeEvery('ACTION_ERROR_PRIMITIVE', primitiveErrorSaga),
  ])
}
