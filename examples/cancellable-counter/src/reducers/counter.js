import {
  INCREMENT,
  DECREMENT,
  INCREMENT_IF_ODD,
  INCREMENT_ASYNC,
  CANCEL_INCREMENT_ASYNC
} from '../actionTypes'

export function incrementAsyncPending(state = false, action) {
  switch (action.type) {
    case INCREMENT_ASYNC:
      return true
    case INCREMENT:
    case CANCEL_INCREMENT_ASYNC:
      return false
    default:
      return state
  }
}



export function counter(state = 0, action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1
    case DECREMENT:
      return state - 1
    case INCREMENT_IF_ODD:
      return state % 2 ? state + 1 : state
    default:
      return state
  }
}
