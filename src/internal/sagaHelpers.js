/* eslint-disable no-constant-condition */

import { take, fork, cancel } from './io'

export function takeEvery(pattern, worker) {
  return function* __takeEvery_watcher() {
    while(true) {
      const action = yield take(pattern)
      yield fork(worker, action)
    }
  }()
}

export function takeLatest(pattern, worker) {
  return function* __takeEvery_watcher() {
    let currentTask
    while(true) {
      const action = yield take(pattern)
      if(currentTask)
        yield cancel(currentTask)
      currentTask = yield fork(worker, action)
    }
  }()
}
