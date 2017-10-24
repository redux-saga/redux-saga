const sym = id => {
  id = `@@redux-saga/${id}`
  return typeof Symbol === 'function' ? Symbol(id) : id
}

export const CANCEL = sym('CANCEL_PROMISE')
export const CHANNEL_END = sym('CHANNEL_END')
export const CHANNEL_END_TYPE = sym('CHANNEL_END')
export const IO = sym('IO')
export const MATCH = sym('MATCH')
export const MULTICAST = sym('MULTICAST')
export const SAGA_ACTION = sym('SAGA_ACTION')
export const SELF_CANCELLATION = sym('SELF_CANCELLATION')
export const TASK = sym('TASK')
export const TASK_CANCEL = sym('TASK_CANCEL')
