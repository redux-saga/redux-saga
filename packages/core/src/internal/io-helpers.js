import * as is from '@redux-saga/is'
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
  if (process.env.NODE_ENV !== 'production') {
    validateTakeEffect(takeEvery, patternOrChannel, worker)
  }

  return fork(takeEveryHelper, patternOrChannel, worker, ...args)
}

export function takeLatest(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    validateTakeEffect(takeLatest, patternOrChannel, worker)
  }

  return fork(takeLatestHelper, patternOrChannel, worker, ...args)
}

export function takeLeading(patternOrChannel, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    validateTakeEffect(takeLeading, patternOrChannel, worker)
  }

  return fork(takeLeadingHelper, patternOrChannel, worker, ...args)
}

export function throttle(ms, pattern, worker, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    check(pattern, is.notUndef, 'throttle requires a pattern')
    check(worker, is.notUndef, 'throttle requires a saga parameter')
  }

  return fork(throttleHelper, ms, pattern, worker, ...args)
}

export function retry(maxTries, delayLength, worker, ...args) {
  return call(retryHelper, maxTries, delayLength, worker, ...args)
}

export function debounce(delayLength, pattern, worker, ...args) {
  return fork(debounceHelper, delayLength, pattern, worker, ...args)
}
