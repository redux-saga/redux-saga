/* eslint-disable no-constant-condition */

import { take, put, call, fork, race } from '../../../../src'
import { INCREMENT_ASYNC, INCREMENT_COUNTER } from '../constants'
import { delay } from '../services'
import { increment, showCongratulation } from '../actions/counter'

export function* incrementAsync() {

  // wait for each INCREMENT_ASYNC action
  while(yield take(INCREMENT_ASYNC)) {
    // call delay : Number -> Promise
    yield call(delay, 1000)
    // dispatch INCREMENT_COUNTER
    yield put(increment())
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
  yield fork(incrementAsync)
  yield fork(onBoarding)
}
