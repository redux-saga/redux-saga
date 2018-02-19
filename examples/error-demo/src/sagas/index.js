/* eslint-disable no-constant-condition */

import { call, put, takeEvery, delay, all, race, fork, spawn, take, select } from '../../../../src/effects'
import { errorGeneratorSelector } from '../reducers/';

function* errorInPutSaga() {
  yield delay(100)
  yield put({type: 'REDUCER_ACTION_ERROR_IN_PUT'})
}

function* errorInSelectSaga() {
  yield delay(100)
  yield select(errorGeneratorSelector)
}

function* throwAnErrorSaga() {
  yield delay(100);
  undefinedIsNotAFunction();
}

function errorInCallSyncSaga() {
  undefinedIsNotAFunction();
}

function* errorInCallAsyncSaga() {
  yield delay(100);
  yield call(throwAnErrorSaga);
}

function* errorInCallInlineSaga() {
  yield call(function* (){
    undefinedIsNotAFunction();
    yield 2;
  });
}

function* errorInForkSaga() {
  yield delay(100);
  yield fork(throwAnErrorSaga);
}

function* errorInSpawnSaga() {
  yield delay(100);
  yield spawn(throwAnErrorSaga);
}

function* errorInRaceSaga() {
  yield delay(100);
  yield race({
    err: call(throwAnErrorSaga),
    ok: delay(100),
  })
  console.log('race finished');
}

function* caughtErrorSaga() {
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
