import { kTrue, noop } from './utils'

export const BUFFER_OVERFLOW = 'Channel\'s Buffer overflow!'

const ON_OVERFLOW_THROW = 1
const ON_OVERFLOW_DROP = 2
const ON_OVERFLOW_SLIDE = 3

const zeroBuffer = {isEmpty: kTrue, put: noop, take: noop}

/**
  TODO: Need to make a more optimized implementation: e.g. Ring buffers, linked lists with Node Object pooling...
**/
function arrBuffer(limit = Infinity, overflowAction) {
  const arr = []
  return {
    isEmpty: () => !arr.length,
    put: it => {
      if(arr.length < limit) {
        arr.push(it)
      } else {
        switch (overflowAction) {
          case ON_OVERFLOW_THROW:
            throw new Error(BUFFER_OVERFLOW)
          case ON_OVERFLOW_SLIDE:
            arr.shift()
            arr.push(it)
            break
          default:
            // DROP
        }
      }
    },
    take: () => arr.shift()
  }
}

export const buffers = {
  none: () => zeroBuffer,
  fixed: limit => arrBuffer(limit, ON_OVERFLOW_THROW),
  dropping: limit => arrBuffer(limit, ON_OVERFLOW_DROP),
  sliding: limit => arrBuffer(limit, ON_OVERFLOW_SLIDE)
}
