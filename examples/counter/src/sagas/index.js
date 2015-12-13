/* eslint-disable no-constant-condition */

import { INCREMENT_ASYNC, INCREMENT_COUNTER } from '../constants'
import { delay } from '../services'
import { increment, showCongratulation } from '../actions/counter'

function* incrementAsync(io) {

  // wait for each INCREMENT_ASYNC action
  while(yield io.take(INCREMENT_ASYNC)) {
    // call delay : Number -> Promise
    yield io.call(delay, 1000)

    // dispatch INCREMENT_COUNTER
    yield io.put(increment())
  }

}

function* onBoarding(io) {
  let nbIncrements = 0
  while(nbIncrements < 3) {
    const winner = yield io.race({
      increment : io.take(INCREMENT_COUNTER),
      timeout   : io.call(delay, 5000)
    })

    if(winner.increment)
      nbIncrements++
    else
      nbIncrements = 0
  }

  yield io.put(showCongratulation())
}

export default [incrementAsync, onBoarding]
