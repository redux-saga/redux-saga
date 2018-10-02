import * as is from '@redux-saga/is'
import { CHANNEL_END_TYPE, MATCH, MULTICAST, SAGA_ACTION } from '@redux-saga/symbols'
import { check, remove, once, internalErr } from './utils'
import * as buffers from './buffers'
import { asap } from './scheduler'
import * as matchers from './matcher'

export const END = { type: CHANNEL_END_TYPE }
export const isEnd = a => a && a.type === CHANNEL_END_TYPE

const CLOSED_CHANNEL_WITH_TAKERS = 'Cannot have a closed channel with pending takers'
const INVALID_BUFFER = 'invalid buffer passed to channel factory function'
const UNDEFINED_INPUT_ERROR = `Saga or channel was provided with an undefined action
Hints:
  - check that your Action Creator returns a non-undefined value
  - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners`

export function channel(buffer = buffers.expanding()) {
  let closed = false
  let takers = []

  if (process.env.NODE_ENV !== 'production') {
    check(buffer, is.buffer, INVALID_BUFFER)
  }

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS)
    }
    if (takers.length && !buffer.isEmpty()) {
      throw internalErr('Cannot have pending takers with non empty buffer')
    }
  }

  function put(input) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates()
      check(input, is.notUndef, UNDEFINED_INPUT_ERROR)
    }

    if (closed) {
      return
    }
    if (takers.length === 0) {
      return buffer.put(input)
    }
    const cb = takers.shift()
    cb(input)
  }

  function take(cb) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates()
      check(cb, is.func, "channel.take's callback must be a function")
    }

    if (closed && buffer.isEmpty()) {
      cb(END)
    } else if (!buffer.isEmpty()) {
      cb(buffer.take())
    } else {
      takers.push(cb)
      cb.cancel = () => {
        remove(takers, cb)
      }
    }
  }

  function flush(cb) {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates()
      check(cb, is.func, "channel.flush' callback must be a function")
    }

    if (closed && buffer.isEmpty()) {
      cb(END)
      return
    }
    cb(buffer.flush())
  }

  function close() {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates()
    }

    if (closed) {
      return
    }

    closed = true

    const arr = takers
    takers = []

    for (let i = 0, len = arr.length; i < len; i++) {
      const taker = arr[i]
      taker(END)
    }
  }

  return {
    take,
    put,
    flush,
    close,
  }
}

export function eventChannel(subscribe, buffer = buffers.none()) {
  let closed = false
  let unsubscribe

  const chan = channel(buffer)
  const close = () => {
    if (closed) {
      return
    }

    closed = true

    if (is.func(unsubscribe)) {
      unsubscribe()
    }
    chan.close()
  }

  unsubscribe = subscribe(input => {
    if (isEnd(input)) {
      close()
      return
    }
    chan.put(input)
  })

  if (process.env.NODE_ENV !== 'production') {
    check(unsubscribe, is.func, 'in eventChannel: subscribe should return a function to unsubscribe')
  }

  unsubscribe = once(unsubscribe)

  if (closed) {
    unsubscribe()
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close,
  }
}

export function multicastChannel() {
  let closed = false
  let currentTakers = []
  let nextTakers = currentTakers

  function checkForbiddenStates() {
    if (closed && nextTakers.length) {
      throw internalErr(CLOSED_CHANNEL_WITH_TAKERS)
    }
  }

  const ensureCanMutateNextTakers = () => {
    if (nextTakers !== currentTakers) {
      return
    }
    nextTakers = currentTakers.slice()
  }

  const close = () => {
    if (process.env.NODE_ENV !== 'production') {
      checkForbiddenStates()
    }

    closed = true
    const takers = (currentTakers = nextTakers)
    nextTakers = []
    takers.forEach(taker => {
      taker(END)
    })
  }

  return {
    [MULTICAST]: true,
    put(input) {
      if (process.env.NODE_ENV !== 'production') {
        checkForbiddenStates()
        check(input, is.notUndef, UNDEFINED_INPUT_ERROR)
      }

      if (closed) {
        return
      }

      if (isEnd(input)) {
        close()
        return
      }

      const takers = (currentTakers = nextTakers)

      for (let i = 0, len = takers.length; i < len; i++) {
        const taker = takers[i]

        if (taker[MATCH](input)) {
          taker.cancel()
          taker(input)
        }
      }
    },
    take(cb, matcher = matchers.wildcard) {
      if (process.env.NODE_ENV !== 'production') {
        checkForbiddenStates()
      }
      if (closed) {
        cb(END)
        return
      }
      cb[MATCH] = matcher
      ensureCanMutateNextTakers()
      nextTakers.push(cb)

      cb.cancel = once(() => {
        ensureCanMutateNextTakers()
        remove(nextTakers, cb)
      })
    },
    close,
  }
}

export function stdChannel() {
  const chan = multicastChannel()
  const { put } = chan
  chan.put = input => {
    if (input[SAGA_ACTION]) {
      put(input)
      return
    }
    asap(() => {
      put(input)
    })
  }
  return chan
}
