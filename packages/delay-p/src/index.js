import { CANCEL } from '@redux-saga/symbols'

const MAX_SIGNED_INT = 2147483647

export default function delayP(ms, val = true) {
  // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
  if (process.env.NODE_ENV !== 'production' && ms > MAX_SIGNED_INT) {
    throw new Error('delay only supports a maximum value of ' + MAX_SIGNED_INT + 'ms')
  }
  let timeoutId
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(resolve, Math.min(MAX_SIGNED_INT, ms), val)
  })

  promise[CANCEL] = () => {
    clearTimeout(timeoutId)
  }

  return promise
}
