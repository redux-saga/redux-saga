/* eslint-disable no-constant-condition */

import { call, put, takeEvery, delay, all, race, fork, spawn, take, select } from '../../../../src/effects'
import { errorGeneratorSelector } from '../reducers/';

export function* errorInPutSaga() {
  yield delay(100)
  yield put({type: 'REDUCER_ACTION_ERROR_IN_PUT'})
}

export function* errorInSelectSaga() {
  yield delay(100)
  yield select(errorGeneratorSelector)
}

export function* throwAnErrorSaga() {
  yield delay(100);
  undefinedIsNotAFunction();
}

export function errorInCallSyncSaga() {
  undefinedIsNotAFunction();
}

export function* errorInCallAsyncSaga() {
  yield delay(100);
  yield call(throwAnErrorSaga);
}

export function* errorInCallInlineSaga() {
  yield call(function* (){
    undefinedIsNotAFunction();
    yield 2;
  });
}

export function* errorInForkSaga() {
  yield delay(100);
  yield fork(throwAnErrorSaga);
}

export function* errorInSpawnSaga() {
  yield delay(100);
  yield spawn(throwAnErrorSaga);
}

export function* errorInRaceSaga() {
  yield delay(100);
  yield race({
    err: call(throwAnErrorSaga),
    ok: delay(100),
  })
  console.log('race finished');
}

export function* caughtErrorSaga() {
  try {
    yield delay(100);
    yield call(throwAnErrorSaga);
  } catch(e) {
    console.error('error was caught', e);
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery('ACTION_ERROR_IN_PUT', errorInPutSaga),
    takeEvery('ACTION_ERROR_IN_SELECT', errorInSelectSaga),
    takeEvery('ACTION_ERROR_IN_CALL_SYNC', errorInCallSyncSaga),
    takeEvery('ACTION_ERROR_IN_CALL_ASYNC', errorInCallAsyncSaga),
    takeEvery('ACTION_ERROR_IN_CALL_INLINE', errorInCallAsyncSaga),
    takeEvery('ACTION_ERROR_IN_FORK', errorInForkSaga),
    takeEvery('ACTION_ERROR_IN_SPAWN', errorInSpawnSaga),
    takeEvery('ACTION_ERROR_IN_RACE', errorInRaceSaga),
    takeEvery('ACTION_CAUGHT_ERROR', caughtErrorSaga),
    fork(function* inlinedSagaName(){
      while(true) {
        yield take('ACTION_INLINE_SAGA_ERROR');
        yield call(throwAnErrorSaga);
      }
    }),
  ]);
}
