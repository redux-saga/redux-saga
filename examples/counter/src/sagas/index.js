import { INCREMENT_ASYNC, INCREMENT_COUNTER, INCREMENT_IF_ODD } from '../constants'
import { nextEvent, race } from '../../../../src'
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
    const { event: isIncrement, effect: timeout} = yield race( nextEvent(INCREMENT_COUNTER), [delay, 5000])
    if(isIncrement)
      count++
    else
      count = 0
  }

  yield showCongratulation()
}

export default [incrementAsync, onBoarding]
