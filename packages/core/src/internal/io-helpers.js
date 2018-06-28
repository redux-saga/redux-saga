import { call, fork } from './io'
import { takeEveryHelper, takeLatestHelper, takeLeadingHelper, throttleHelper, retryHelper, debounceHelper } from './sagaHelpers'

export function takeEvery(patternOrChannel, worker, ...args) {
  return fork(takeEveryHelper, patternOrChannel, worker, ...args)
}

export function takeLatest(patternOrChannel, worker, ...args) {
  return fork(takeLatestHelper, patternOrChannel, worker, ...args)
}

export function takeLeading(patternOrChannel, worker, ...args) {
  return fork(takeLeadingHelper, patternOrChannel, worker, ...args)
}

export function throttle(ms, pattern, worker, ...args) {
  return fork(throttleHelper, ms, pattern, worker, ...args)
}

export function retry(maxTries, delayLength, worker, ...args) {
  return call(retryHelper, maxTries, delayLength, worker, ...args)
}

export function debounce(delayLength, pattern, worker, ...args) {
  return fork(debounceHelper, delayLength, pattern, worker, ...args)
}
