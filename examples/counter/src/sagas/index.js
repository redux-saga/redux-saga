import { INCREMENT_ASYNC } from '../constants'
import { TIMEOUT } from '../middlewares/timeout'
import { increment } from '../actions/counter'

function* incrementAsync(getState, action) {

  // yield a side effect : delay by 1000
  yield { [TIMEOUT]: 1000 }

  // yield an action : INCREMENT_COUNTER
  yield increment()

}

export default function(state, action) {
  if(action.type === INCREMENT_ASYNC)
    return incrementAsync
}
