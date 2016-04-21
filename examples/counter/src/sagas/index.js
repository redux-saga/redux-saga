/* eslint-disable no-constant-condition */

//import { take } from '../../../../src'
import { put, call, take, actionChannel } from '../../../../src/effects'

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put({type: 'INCREMENT'})
}

export default function* rootSaga() {
  const chan = yield actionChannel('INCREMENT_ASYNC')
  window.chan = chan
  while (true) {
    console.log('take INCREMENT_ASYNC')
    yield take(chan)
    console.log('took it')
    yield call(delay, 1000)
    yield put({type: 'INCREMENT'})
  }

}
