/* eslint-disable no-constant-condition */

import { put, takeEvery, delay } from '../../../../src/effects'

export function* incrementAsync() {
  yield delay(1000)
  yield put({type: 'INCREMENT'})
}

export default function* rootSaga() {
  yield takeEvery('INCREMENT_ASYNC', incrementAsync)
}
