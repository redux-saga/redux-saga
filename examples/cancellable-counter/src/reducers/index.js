import { combineReducers } from '@reduxjs/toolkit'
import { counter, countdown } from './counter'

const rootReducer = combineReducers({
  countdown,
  counter,
})

export default rootReducer
