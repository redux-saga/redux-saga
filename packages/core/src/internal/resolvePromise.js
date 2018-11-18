import * as is from '@redux-saga/is'
import { CANCEL } from '@redux-saga/symbols'

export default function resolvePromise(promise, cb) {
  const cancelPromise = promise[CANCEL]

  if (is.func(cancelPromise)) {
    cb.cancel = cancelPromise
  }

  promise.then(cb, error => {
    cb(error, true)
  })
}
