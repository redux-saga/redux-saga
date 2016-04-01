import middleware from './internal/middleware'
export default middleware


import _SagaCancellationException from './internal/SagaCancellationException'
export const SagaCancellationException = _SagaCancellationException
export const isCancelError = error => error instanceof SagaCancellationException

export { runSaga, storeIO } from './internal/runSaga'

export { takeEvery, takeLatest } from './internal/sagaHelpers'

import * as effects from './effects'
import * as monitorActions from './internal/monitorActions';
import * as utils from './utils'

export {
  effects,
  monitorActions,
  utils
}
