/* eslint-disable no-constant-condition */

import { take, put, call, fork, race } from 'redux-saga/effects'
import { CANCEL } from 'redux-saga/utils'
import { INCREMENT_ASYNC, INCREMENT, CANCEL_INCREMENT_ASYNC, SHOW_CONGRATULATION } from '../actionTypes'

const action = type => ({type})

function delay(millis) {
    let tid
    const promise = new Promise(resolve => {
      tid = setTimeout( () => {
        resolve(true)
      }, millis )
    })

    promise[CANCEL] = () => clearTimeout(tid)
    return promise
}

export function* incrementAsync() {
  yield call(delay, 1000)
  yield put(action(INCREMENT))
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
      increment : take(INCREMENT),
      timeout   : call(delay, 5000)
    })

    if(winner.increment)
      nbIncrements++
    else
      nbIncrements = 0
  }

  yield put(action(SHOW_CONGRATULATION))
}

export default function* rootSaga() {
  yield fork(watchIncrementAsync)
  yield fork(onBoarding)
}
