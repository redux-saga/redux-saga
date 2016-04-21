/* eslint-disable no-constant-condition */

import { take, takem, put, call, fork, race, cancelled } from 'redux-saga/effects'
import { eventChannel, END } from 'redux-saga'
import { INCREMENT_ASYNC, INCREMENT, CANCEL_INCREMENT_ASYNC } from '../actionTypes'

const action = type => ({type})

/*eslint-disable no-console*/
const countdown = (secs) => {
  return eventChannel(listener => {
      const iv = setInterval(() => {
        console.log('countdown', secs)
        secs -= 1
        if(secs > 0)
          listener(secs)
        else {
          listener(END)
          clearInterval(iv)
          console.log('countdown terminated')
        }
      }, 1000);
      return () => {
        clearInterval(iv)
        console.log('countdown cancelled')
      }
    }
  )
}

export function* incrementAsync({value}) {
  const chan = yield call(countdown, value)
  try {
    let ev = yield takem(chan)
    while(ev !== END) {
      yield put({type: INCREMENT_ASYNC, value: ev})
      ev = yield takem(chan)
    }
    yield put(action(INCREMENT))
  } finally {
    if(yield cancelled()) {
      console.log('task cancelled')
    }
    chan.close()
  }
}

export function* watchIncrementAsync() {
  let action
  while((action = yield take(INCREMENT_ASYNC)) !== END) {
    // starts a 'Race' between an async increment and a user cancel action
    // if user cancel action wins, the incrementAsync will be cancelled automatically
    yield race([
      call(incrementAsync, action),
      take(CANCEL_INCREMENT_ASYNC)
    ])
  }
}

export default function* rootSaga() {
  yield fork(watchIncrementAsync)
}
