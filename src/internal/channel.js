import { is, check, remove, MATCH, internalErr} from './utils'
import {buffers} from './buffers'

const CHANNEL_END_TYPE = '@@redux-saga/CHANNEL_END'
export const END = {type: CHANNEL_END_TYPE}
export const isEnd = a => a && a.type === CHANNEL_END_TYPE

export function emitter() {
  const subscribers = []

  function subscribe(sub) {
    subscribers.push(sub)
    return () => remove(subscribers, sub)
  }

  function emit(item) {
    const arr = subscribers.slice()
    for (var i = 0, len =  arr.length; i < len; i++) {
      arr[i](item)
    }
  }

  return {
    subscribe,
    emit
  }
}

export const INVALID_BUFFER = 'invalid buffer passed to channel factory function'
export var UNDEFINED_INPUT_ERROR = 'Saga was provided with an undefined action'

if(process.env.NODE_ENV !== 'production') {
  UNDEFINED_INPUT_ERROR += `\nHints:
    - check that your Action Creator returns a non-undefined value
    - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners
  `
}

export function channel(buffer = buffers.fixed()) {
  let closed = false
  let takers = []

  check(buffer, is.buffer, INVALID_BUFFER)

  function checkForbiddenStates() {
    if(closed && takers.length) {
      throw internalErr('Cannot have a closed channel with pending takers')
    }
    if(takers.length && !buffer.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer')
    }
  }

  function put(input) {
    checkForbiddenStates()
    check(input, is.notUndef, UNDEFINED_INPUT_ERROR)
    if (closed) {
      return
    }
    if (!takers.length) {
      return buffer.put(input)
    }
    for (var i = 0; i < takers.length; i++) {
      const cb = takers[i]
      if(!cb[MATCH] || cb[MATCH](input)) {
        takers.splice(i, 1)
        return cb(input)
      }
    }
  }

  function take(cb) {
    checkForbiddenStates()
    check(cb, is.func, 'channel.take\'s callback must be a function')

    if(closed && buffer.isEmpty()) {
      cb(END)
    } else if(!buffer.isEmpty()) {
      cb(buffer.take())
    } else {
      takers.push(cb)
      cb.cancel = () => remove(takers, cb)
    }
  }

  function flush(cb) {
    checkForbiddenStates() // TODO: check if some new state should be forbidden now
    check(cb, is.func, 'channel.flush\' callback must be a function')
    if (closed && buffer.isEmpty()) {
      cb(END)
      return
    }
    cb(buffer.flush())
  }

  function close() {
    checkForbiddenStates()
    if(!closed) {
      closed = true
      if(takers.length) {
        const arr = takers
        takers = []
        for (let i = 0, len = arr.length; i < len; i++) {
          arr[i](END)
        }
      }
    }
  }

  return {take, put, flush, close,
    get __takers__() { return takers },
    get __closed__() { return closed }
  }
}

export function eventChannel(subscribe, buffer = buffers.none(), matcher) {
  /**
    should be if(typeof matcher !== undefined) instead?
    see PR #273 for a background discussion
  **/
  if(arguments.length > 2) {
    check(matcher, is.func, 'Invalid match function passed to eventChannel')
  }

  const chan = channel(buffer)
  const unsubscribe = subscribe(input => {
    if(isEnd(input)) {
      chan.close()
    } else if(!matcher || matcher(input)) {
      chan.put(input)
    }
  })

  if(!is.func(unsubscribe)) {
    throw new Error('in eventChannel: subscribe should return a function to unsubscribe')
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close: () => {
      if(!chan.__closed__) {
        chan.close()
        unsubscribe()
      }
    }
  }
}

export function stdChannel(subscribe) {
  const chan = eventChannel(subscribe)

  return {
    ...chan,
    take(cb, matcher) {
      if(arguments.length > 1) {
        check(matcher, is.func, 'channel.take\'s matcher argument must be a function')
        cb[MATCH] = matcher
      }
      chan.take(cb)
    }
  }
}
