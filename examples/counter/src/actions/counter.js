import {
  INCREMENT_COUNTER,
  DECREMENT_COUNTER,
  INCREMENT_IF_ODD,
  INCREMENT_ASYNC,
  CANCEL_INCREMENT_ASYNC,
  SHOW_CONGRATULATION,
  HIDE_CONGRATULATION
} from '../constants'

export function increment() {
  return {
    type: INCREMENT_COUNTER
  }
}

export function decrement() {
  return {
    type: DECREMENT_COUNTER
  }
}

export function incrementIfOdd() {
  return {
    type: INCREMENT_IF_ODD
  }
}

export function incrementAsync() {
  return {
    type: INCREMENT_ASYNC
  }
}

export function cancelIncrementAsync() {
  return {
    type: CANCEL_INCREMENT_ASYNC
  }
}

export function showCongratulation() {
  return {
    type: SHOW_CONGRATULATION
  }
}

export function hideCongratulation() {
  return {
    type: HIDE_CONGRATULATION
  }
}
