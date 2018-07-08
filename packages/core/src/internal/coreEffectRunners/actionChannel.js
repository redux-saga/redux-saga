import { channel, isEnd } from '../channel'
import matcher from '../matcher'

export default function actionChannel(env, { pattern, buffer }, cb) {
  // TODO: rethink how END is handled
  const chan = channel(buffer)
  const match = matcher(pattern)

  const taker = action => {
    if (!isEnd(action)) {
      env.stdChannel.take(taker, match)
    }
    chan.put(action)
  }

  env.stdChannel.take(taker, match)
  cb(chan)
}
