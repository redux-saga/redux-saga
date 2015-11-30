import { INCREMENT_ASYNC } from '../constants'
import { TIMEOUT } from '../services'
import { increment } from '../actions/counter'

function* incrementAsync() {

  // yield a side effect : delay by 1000
  yield { [TIMEOUT]: 1000 }

  // yield an action : INCREMENT_COUNTER
  yield increment()

}

export default function* rootSaga(getSate, action) {
  if(action.type === INCREMENT_ASYNC)
    yield* incrementAsync()
}
