import {
  SHOW_CONGRATULATION,
  HIDE_CONGRATULATION
} from '../constants'

export default function counter(state = false, action) {
  switch (action.type) {
    case SHOW_CONGRATULATION:
      return true
    case HIDE_CONGRATULATION:
      return false
    default:
      return state
  }
}
