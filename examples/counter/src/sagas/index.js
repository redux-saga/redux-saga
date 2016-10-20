/* eslint-disable no-constant-condition */

import { put, call, takeEvery } from '../../../../src/effects'
import { delay } from '../../../../src'

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put({type: 'INCREMENT'})
}

export default function* rootSaga() {
  yield takeEvery('INCREMENT_ASYNC', incrementAsync)
}
