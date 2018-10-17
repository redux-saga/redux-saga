import { CANCEL } from '@redux-saga/symbols'

export default function delayP(ms, returnValue = true) {
  let timeoutId
  const promise = new Promise(resolve => {
    timeoutId = setTimeout(resolve, ms, returnValue)
  })

  promise[CANCEL] = () => {
    clearTimeout(timeoutId)
  }

  return promise
}
