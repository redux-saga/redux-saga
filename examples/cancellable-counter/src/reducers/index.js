import { combineReducers } from 'redux'
import { counter, countdown } from './counter'

const rootReducer = combineReducers({
  countdown,
  counter
})

export default rootReducer
