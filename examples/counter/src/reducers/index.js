import { combineReducers } from 'redux'
import counter from './counter'
import congratulate from './congratulate'

const rootReducer = combineReducers({
  counter,
  congratulate
})

export default rootReducer
