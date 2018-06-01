const createName = name => `@@redux-saga/${name}`

const createSymbol = id => {
  id = createName(id)
  return typeof Symbol === 'function' ? Symbol(id) : id
}

const createGlobalSymbol = id => {
  id = createName(id)
  return typeof Symbol === 'function' && typeof Symbol.for === 'function' ? Symbol.for(id) : id
}

export const CANCEL = createSymbol('CANCEL_PROMISE')
export const CHANNEL_END_TYPE = createSymbol('CHANNEL_END')
export const IO = createSymbol('IO')
export const MATCH = createSymbol('MATCH')
export const MULTICAST = createSymbol('MULTICAST')
export const SAGA_ACTION = createSymbol('SAGA_ACTION')
export const SELF_CANCELLATION = createSymbol('SELF_CANCELLATION')
export const TASK = createSymbol('TASK')
export const TASK_CANCEL = createSymbol('TASK_CANCEL')
export const TERMINATE = createSymbol('TERMINATE')

export const SAGA_LOCATION = createGlobalSymbol('LOCATION')
