import { CHANNEL_END_TYPE, MATCH, MULTICAST, SAGA_ACTION } from './symbols'
import { is, check, remove, once, internalErr } from './utils'
import * as buffers from './buffers'
import { asap } from './scheduler'
import * as matchers from './matcher'

export const END = { type: CHANNEL_END_TYPE }
export const isEnd = a => a && a.type === CHANNEL_END_TYPE

export const INVALID_BUFFER = 'invalid buffer passed to channel factory function'
let UNDEFINED_INPUT_ERROR = 'Saga or channel was provided with an undefined action'

if (process.env.NODE_ENV !== 'production') {
  UNDEFINED_INPUT_ERROR += `\nHints:
    - check that your Action Creator returns a non-undefined value
    - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners
  `
}

export function channel(buffer = buffers.expanding()) {
  let closed = false
  let takers = []

  check(buffer, is.buffer, INVALID_BUFFER)

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw internalErr('Cannot have a closed channel with pending takers')
    }
    if (takers.length && !buffer.isEmpty()) {
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
    const cb = takers[0]
    takers.splice(0, 1)
    cb(input)
  }

  function take(cb) {
    checkForbiddenStates()
    check(cb, is.func, "channel.take's callback must be a function")

    if (closed && buffer.isEmpty()) {
      cb(END)
    } else if (!buffer.isEmpty()) {
      cb(buffer.take())
    } else {
      takers.push(cb)
      cb.cancel = () => remove(takers, cb)
    }
  }

  function flush(cb) {
    checkForbiddenStates() // TODO: check if some new state should be forbidden now
    check(cb, is.func, "channel.flush' callback must be a function")
    if (closed && buffer.isEmpty()) {
      cb(END)
      return
    }
    cb(buffer.flush())
  }

  function close() {
    checkForbiddenStates()
    if (!closed) {
      closed = true
      if (takers.length) {
        const arr = takers
        takers = []
        for (let i = 0, len = arr.length; i < len; i++) {
          const taker = arr[i]
          taker(END)
        }
      }
    }
  }

  return {
    take,
    put,
    flush,
    close,
    get __takers__() {
      return takers
    },
    get __closed__() {
      return closed
    },
  }
}

export function eventChannel(subscribe, buffer = buffers.none()) {
  const chan = channel(buffer)
  const close = () => {
    if (!chan.__closed__) {
      if (unsubscribe) {
        unsubscribe()
      }
      chan.close()
    }
  }
  const unsubscribe = subscribe(input => {
    if (isEnd(input)) {
      close()
      return
    }
    chan.put(input)
  })
  if (chan.__closed__) {
    unsubscribe()
  }

  if (!is.func(unsubscribe)) {
    throw new Error('in eventChannel: subscribe should return a function to unsubscribe')
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

  const ensureCanMutateNextTakers = () => {
    if (nextTakers !== currentTakers) {
      return
    }
    nextTakers = currentTakers.slice()
  }

  // TODO: check if its possible to extract closing function and reuse it in both unicasts and multicasts
  const close = () => {
    closed = true
    const takers = (currentTakers = nextTakers)

    for (let i = 0; i < takers.length; i++) {
      const taker = takers[i]
      taker(END)
    }

    nextTakers = []
  }

  return {
    [MULTICAST]: true,
    put(input) {
      // TODO: should I check forbidden state here? 1 of them is even impossible
      // as we do not possibility of buffer here
      check(input, is.notUndef, UNDEFINED_INPUT_ERROR)

      if (closed) {
        return
      }

      if (isEnd(input)) {
        close()
        return
      }

      const takers = (currentTakers = nextTakers)
      for (let i = 0; i < takers.length; i++) {
        const taker = takers[i]
        if (taker[MATCH](input)) {
          taker.cancel()
          taker(input)
        }
      }
    },
    take(cb, matcher = matchers.wildcard) {
      if (closed) {
        cb(END)
        return
      }
      cb[MATCH] = matcher
      ensureCanMutateNextTakers()
      if (nextTakers.length > 10) throw new Error('too many takers')
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
    asap(() => put(input))
  }
  return chan
}
