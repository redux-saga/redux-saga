import { kTrue, noop } from './utils'

export const BUFFER_OVERFLOW = 'Channel\'s Buffer overflow!'

const ON_OVERFLOW_THROW = 1
const ON_OVERFLOW_DROP = 2
const ON_OVERFLOW_SLIDE = 3

const zeroBuffer = {isEmpty: kTrue, put: noop, take: noop}

function ringBuffer(limit = 10, overflowAction) {
  const arr = new Array(limit)
  let length = 0
  let pushIndex = 0
  let popIndex = 0
  return {
    isEmpty: () => length == 0,
    put: it => {
      if(length < limit) {
        arr[pushIndex] = it
        pushIndex = (pushIndex + 1) % limit
        length++
      } else {
        switch(overflowAction) {
          case ON_OVERFLOW_THROW:
            throw new Error(BUFFER_OVERFLOW)
          case ON_OVERFLOW_SLIDE:
            arr[pushIndex] = it
            pushIndex = (pushIndex + 1) % limit
            popIndex = pushIndex
            break
          default:
            // DROP
        }
      }
    },
    take: () => {
      if(length != 0) {
        let it = arr[popIndex]
        arr[popIndex] = null
        length--
        popIndex = (popIndex + 1) % limit
        return it
      }
    },
    flush: () => {
      let flushedItems = []
      for (let i = 0, len = length; i < len; i++) {
        flushedItems.push(arr[popIndex])
        arr[popIndex] = null
        length--
        popIndex = (popIndex + 1) % limit
      }
      return flushedItems
    }
  }
}

export const buffers = {
  none: () => zeroBuffer,
  fixed: limit => ringBuffer(limit, ON_OVERFLOW_THROW),
  dropping: limit => ringBuffer(limit, ON_OVERFLOW_DROP),
  sliding: limit => ringBuffer(limit, ON_OVERFLOW_SLIDE)
}
