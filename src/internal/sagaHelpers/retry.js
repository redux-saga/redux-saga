/* eslint-disable no-constant-condition */
import { call } from '../io'
import { delay } from '../utils'

export default function* retry(maxTries, delayMs, worker, ...args) {
  let tries = 0
  while (true) {
    tries++

    try {
      const result = yield call(worker, ...args)
      return result
    } catch (err) {
      if (tries === maxTries) {
        throw err
      } else {
        yield call(delay, delayMs)
      }
    }
  }
}
