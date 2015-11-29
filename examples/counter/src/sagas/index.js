
import counter from './counter'

const rootSaga = (state, action) => {
  return counter(state, action)
}

export default rootSaga
