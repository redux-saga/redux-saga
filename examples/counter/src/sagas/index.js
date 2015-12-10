import { INCREMENT_ASYNC, INCREMENT_COUNTER, INCREMENT_IF_ODD } from '../constants'
import { nextAction, race } from '../../../../src'
import { delay } from '../services'
import { increment, showCongratulation } from '../actions/counter'

function* incrementAsync(getState) {

  while(true) {
    // wait for INCREMENT_ASYNC action
    yield nextAction(INCREMENT_ASYNC)
    
    yield [delay, 1000]

    // yield an action : INCREMENT_COUNTER
    yield increment()
  }

}

function* onBoarding(getState) {
  let count = 0
  while(count < 3) {
    const {nextIncrement, timeout} = yield race({
      nextIncrement : nextAction(INCREMENT_COUNTER),
      timeout       : [delay, 5000]
    })

    if(nextIncrement)
      count++
    else
      count = 0
  }

  yield showCongratulation()
}

export default [incrementAsync, onBoarding]
