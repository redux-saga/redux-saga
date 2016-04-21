/* eslint-disable no-constant-condition */

import { takeEvery } from '../../../../src'
import { put, call } from '../../../../src/effects'

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put({type: 'INCREMENT'})
}

export default function* rootSaga() {
  yield* takeEvery('INCREMENT_ASYNC', incrementAsync)
}
