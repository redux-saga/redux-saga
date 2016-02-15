import {
  SHOW_CONGRATULATION,
  HIDE_CONGRATULATION
} from '../actionTypes'

export default function congratulate(state = false, action) {
  switch (action.type) {
    case SHOW_CONGRATULATION:
      return true
    case HIDE_CONGRATULATION:
      return false
    default:
      return state
  }
}
