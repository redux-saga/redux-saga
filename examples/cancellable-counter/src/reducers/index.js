import { combineReducers } from 'redux'
import { counter, incrementAsyncPending } from './counter'
import congratulate from './congratulate'

const rootReducer = combineReducers({
  incrementAsyncPending,
  counter,
  congratulate
})

export default rootReducer
