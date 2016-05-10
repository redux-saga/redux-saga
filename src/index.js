import middleware from './internal/middleware'
export default middleware


export { runSaga } from './internal/runSaga'
export { END, eventChannel, channel } from './internal/channel'
export { buffers } from './internal/buffers'
export { takeEvery, takeLatest } from './internal/sagaHelpers'

import { CANCEL } from './internal/proc'
import * as effects from './effects'
import * as utils from './utils'

export function delay(ms, val=true) {
  let timeoutId;
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(val), ms);
  });

  promise[CANCEL] = () => clearTimeout(timeoutId);

  return promise;
}

export {
  CANCEL,
  effects,
  utils
}
