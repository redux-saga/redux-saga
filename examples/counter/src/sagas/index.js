/* eslint-disable no-constant-condition */

import { take, put, call, fork, race } from '../../../../src'
import { INCREMENT_ASYNC, INCREMENT_COUNTER, CANCEL_INCREMENT_ASYNC } from '../constants'
import { delay } from '../services'
import { increment, showCongratulation } from '../actions/counter'

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put(increment())
}

export function* watchIncrementAsync() {
  while(yield take(INCREMENT_ASYNC)) {
    // starts a 'Race' between an async increment and a user cancel action
    // if user cancel action wins, the incrementAsync will be cancelled automatically
    yield race([
      call(incrementAsync),
      take(CANCEL_INCREMENT_ASYNC)
    ])
  }
}

export function* onBoarding() {
  let nbIncrements = 0
  while(nbIncrements < 3) {
    const winner = yield race({
      increment : take(INCREMENT_COUNTER),
      timeout   : call(delay, 5000)
    })

    if(winner.increment)
      nbIncrements++
    else
      nbIncrements = 0
  }

  yield put(showCongratulation())
}

export default function* root() {
  yield fork(watchIncrementAsync)
  yield fork(onBoarding)
}
