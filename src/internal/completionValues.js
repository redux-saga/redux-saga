import { CHANNEL_END as CHANNEL_END_SYMBOL, TASK_CANCEL as TASK_CANCEL_SYMBOL } from './symbols'

// TODO: check if this hacky toString stuff is needed
// also check again whats the difference between CHANNEL_END and CHANNEL_END_TYPE
// maybe this could become MAYBE_END
// I guess this gets exported so takeMaybe result can be checked
export const CHANNEL_END = {
  toString() {
    return CHANNEL_END_SYMBOL
  },
}
export const TASK_CANCEL = {
  toString() {
    return TASK_CANCEL_SYMBOL
  },
}
