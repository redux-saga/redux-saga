/* eslint-disable no-constant-condition */

import { takeEvery } from 'redux-saga'
import { put, call } from 'redux-saga/effects'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put({type: 'INCREMENT'})
}

export default function* rootSaga() {
  yield* takeEvery('INCREMENT_ASYNC', incrementAsync)
}
