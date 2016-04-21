import middleware from './internal/middleware'
export default middleware


import _SagaCancellationException from './internal/SagaCancellationException'
export const SagaCancellationException = _SagaCancellationException
export const isCancelError = error => error instanceof SagaCancellationException

export { runSaga } from './internal/runSaga'
export { CANCEL } from './internal/proc'
export { END, eventChannel } from './internal/channel'
export { takeEvery, takeLatest } from './internal/sagaHelpers'

import * as effects from './effects'
import * as utils from './utils'

export {
  effects,
  utils
}
