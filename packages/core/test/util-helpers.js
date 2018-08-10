import deferred from '@redux-saga/deferred'

export function arrayOfDeferred(length) {
  const arr = []
  for (let i = 0; i < length; i++) {
    arr.push(deferred())
  }
  return arr
}
