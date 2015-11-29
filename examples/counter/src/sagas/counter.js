import { INCREMENT_ASYNC, TIMEOUT } from '../constants'
import { increment } from '../actions/counter'

export default function counter(state, action) {
  switch (action.type) {
    case INCREMENT_ASYNC:
      return [{
        type    : TIMEOUT,
        delay   : 1000,
        reaction: increment
      }]
    default:
      return []
  }
}
