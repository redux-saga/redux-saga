import * as is from '@redux-saga/is'
import { isDevelopment } from '#is-development'
import { call, fork } from './io'
import { check } from './utils'
import {
  takeEveryHelper,
  takeLatestHelper,
  takeLeadingHelper,
  throttleHelper,
  retryHelper,
  debounceHelper,
} from './sagaHelpers'

const validateTakeEffect = (fn, patternOrChannel, worker) => {
  check(patternOrChannel, is.notUndef, `${fn.name} requires a pattern or channel`)
  check(worker, is.notUndef, `${fn.name} requires a saga parameter`)
}

export function takeEvery(patternOrChannel, worker, ...args) {
  if (isDevelopment) {
    validateTakeEffect(takeEvery, patternOrChannel, worker)
  }

  return fork(takeEveryHelper, patternOrChannel, worker, ...args)
}

export function takeLatest(patternOrChannel, worker, ...args) {
  if (isDevelopment) {
    validateTakeEffect(takeLatest, patternOrChannel, worker)
  }

  return fork(takeLatestHelper, patternOrChannel, worker, ...args)
}

export function takeLeading(patternOrChannel, worker, ...args) {
  if (isDevelopment) {
    validateTakeEffect(takeLeading, patternOrChannel, worker)
  }

  return fork(takeLeadingHelper, patternOrChannel, worker, ...args)
}

export function throttle(ms, patternOrChannel, worker, ...args) {
  if (isDevelopment) {
    check(patternOrChannel, is.notUndef, `throttle requires a pattern or channel`)
    check(worker, is.notUndef, 'throttle requires a saga parameter')
  }

  return fork(throttleHelper, ms, patternOrChannel, worker, ...args)
}

export function retry(maxTries, delayLength, worker, ...args) {
  return call(retryHelper, maxTries, delayLength, worker, ...args)
}

export function debounce(delayLength, pattern, worker, ...args) {
  return fork(debounceHelper, delayLength, pattern, worker, ...args)
}
