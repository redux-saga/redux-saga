import fsmIterator, { qEnd, safeName } from './fsmIterator'
import { take, call, flush, actionChannel } from '../io'
import * as buffers from '../buffers'
import { END } from '../channel'

export default function takeExclusive(patternOrChannel, worker, ...args) {
  const yActionChannel = { done: false, value: actionChannel(patternOrChannel, buffers.dropping(1)) }
  const yTake = ch => ({ done: false, value: take(ch) })
  const yCall = ac => ({ done: false, value: call(worker, ...args, ac) })
  const yFlush = ch => ({ done: false, value: flush(ch) })

  let channel, action
  const setChannel = ch => (channel = ch)
  const setAction = ac => (action = ac)

  return fsmIterator(
    {
      q1() {
        return ['q2', yActionChannel, setChannel]
      },
      q2() {
        return ['q3', yTake(channel), setAction]
      },
      q3() {
        return action === END ? [qEnd] : ['q4', yCall(action)]
      },
      q4() {
        return ['q2', yFlush(channel)]
      },
    },
    'q1',
    `takeExclusive(${safeName(patternOrChannel)}, ${worker.name})`,
  )
}
