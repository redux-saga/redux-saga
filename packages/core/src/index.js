import middleware from './internal/middleware'
export default middleware

export { runSaga } from './internal/runSaga'
export { END, isEnd, eventChannel, channel, multicastChannel, stdChannel } from './internal/channel'
export { CANCEL, SAGA_LOCATION } from './internal/symbols'
export { detach } from './internal/io'

import * as effects from './effects'
import * as utils from './utils'
import * as buffers from './internal/buffers'

export { effects, utils, buffers }
