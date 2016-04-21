import { is, check, remove , MATCH, internalErr} from './utils'
import {buffers} from './buffers'

export const END = {type: '@@redux-saga/CHANNEL_END'}

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


export const INVALID_BUFFER = `invalid buffer passed to channel factory function`
export const UNDEFINED_INPUT_ERROR = `
  Saga was provided with an undefined action
  Hints :
  - check that your Action Creator returns a non undefined value
  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners
`



export function channel(buffer) {

  let closed = false
  let takers = []

  if(arguments.length > 0) {
    check(buffer, is.buffer, INVALID_BUFFER)
  } else {
    buffer = buffers.fixed()
  }

  function checkForbiddenStates() {
    if(closed && takers.length)
      throw internalErr('Can not have a closed channel with pending takers')
    if(takers.length && !buffer.isEmpty())
      throw internalErr('Can not have pedning takers with non empty buffer')
  }

  function put(input) {
    checkForbiddenStates()
    check(input, is.notUndef, UNDEFINED_INPUT_ERROR)
    if(!closed) {
      if(takers.length) {
        for (var i = 0; i < takers.length; i++) {
          const cb = takers[i]
          if(!cb[MATCH] || cb[MATCH](input)) {
            takers.splice(i, 1)
            return cb(input)
          }
        }
      } else {
        buffer.put(input)
      }
    }
  }

  function take(cb, matcher) {
    checkForbiddenStates()
    check(cb, is.func, 'channel.take\'s callback must be a function')
    if(arguments.length > 1) {
      check(matcher, is.func, 'channel.take\'s matcher argument must be a function')
      cb[MATCH] = matcher
    }
    if(closed && buffer.isEmpty())
      cb(END)

    else if(!buffer.isEmpty())
      cb(buffer.take())

    else {
      takers.push(cb)
      cb.cancel = () => remove(takers, cb)
    }
  }

  function close() {
    checkForbiddenStates()
    if(!closed) {
      closed = true
      if(takers.length) {
        const arr = takers
        takers = []
        for (var i = 0, len = arr.length; i < len; i++) {
          arr[i](END)
        }
        takers = []
      }
    }
  }

  return { take, put, close,
    get __takers__ () { return takers },
    get __closed__()  { return closed }
  }
}

export function eventChannel(subscribe, buffer = buffers.none(), matcher) {
  if(arguments.length > 1)
    check(matcher, is.func, 'Invalid match function passed to eventChannel')

  const chan = channel(buffer)
  const unsubscribe = subscribe(input => {
    if(input === END)
      chan.close()
    else if(!matcher || matcher(input))
      chan.put(input)
  })

  return {
    take: chan.take,
    close: () => {
      if(!chan.__closed__) {
        chan.close()
        unsubscribe()
      }
    }
  }
}
