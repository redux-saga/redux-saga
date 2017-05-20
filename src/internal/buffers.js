import { kTrue, noop } from './utils'

export const BUFFER_OVERFLOW = "Channel's Buffer overflow!"

const ON_OVERFLOW_THROW = 1
const ON_OVERFLOW_DROP = 2
const ON_OVERFLOW_SLIDE = 3
const ON_OVERFLOW_EXPAND = 4

const zeroBuffer = { isEmpty: kTrue, put: noop, take: noop }

function ringBuffer(limit = 10, overflowAction) {
  let arr = new Array(limit)
  let length = 0
  let pushIndex = 0
  let popIndex = 0

  const push = it => {
    arr[pushIndex] = it
    pushIndex = (pushIndex + 1) % limit
    length++
  }

  const take = () => {
    if (length != 0) {
      let it = arr[popIndex]
      arr[popIndex] = null
      length--
      popIndex = (popIndex + 1) % limit
      return it
    }
  }

  const flush = () => {
    let items = []
    while (length) {
      items.push(take())
    }
    return items
  }

  return {
    isEmpty: () => length == 0,
    put: it => {
      if (length < limit) {
        push(it)
      } else {
        let doubledLimit
        switch (overflowAction) {
          case ON_OVERFLOW_THROW:
            throw new Error(BUFFER_OVERFLOW)
          case ON_OVERFLOW_SLIDE:
            arr[pushIndex] = it
            pushIndex = (pushIndex + 1) % limit
            popIndex = pushIndex
            break
          case ON_OVERFLOW_EXPAND:
            doubledLimit = 2 * limit

            arr = flush()

            length = arr.length
            pushIndex = arr.length
            popIndex = 0

            arr.length = doubledLimit
            limit = doubledLimit

            push(it)
            break
          default:
          // DROP
        }
      }
    },
    take,
    flush,
  }
}

export const buffers = {
  none: () => zeroBuffer,
  fixed: limit => ringBuffer(limit, ON_OVERFLOW_THROW),
  dropping: limit => ringBuffer(limit, ON_OVERFLOW_DROP),
  sliding: limit => ringBuffer(limit, ON_OVERFLOW_SLIDE),
  expanding: initialSize => ringBuffer(initialSize, ON_OVERFLOW_EXPAND),
}
