import { INCREMENT_ASYNC, INCREMENT_COUNTER, INCREMENT_IF_ODD } from '../constants'
import { nextEvent } from '../../../../src'
import { delay } from '../services'
import { increment, showCongratulation } from '../actions/counter'

function* incrementAsync(getState) {

  while(true) {
    const event = yield nextEvent(INCREMENT_ASYNC)
    // yield a side effect : delay by 1000
    yield [delay, 1000]

    // yield an action : INCREMENT_COUNTER
    yield increment()
  }

}

function* onBoarding(getState) {
  let count = 0
  while(count < 3) {
    const event = yield nextEvent(INCREMENT_COUNTER, INCREMENT_IF_ODD)
    count++
  }

  yield showCongratulation()
}

export default [incrementAsync, onBoarding]
