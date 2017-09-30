import takeEveryHelper from './takeEvery'
import takeLatestHelper from './takeLatest'
import throttleHelper from './throttle'

import { deprecate } from '../utils'

const deprecationWarning = helperName =>
  `import { ${helperName} } from 'redux-saga' has been deprecated in favor of import { ${helperName} } from 'redux-saga/effects'.
The latter will not work with yield*, as helper effects are wrapped automatically for you in fork effect.
Therefore yield ${helperName} will return task descriptor to your saga and execute next lines of code.`

const takeEvery = deprecate(takeEveryHelper, deprecationWarning('takeEvery'))
const takeLatest = deprecate(takeLatestHelper, deprecationWarning('takeLatest'))
const throttle = deprecate(throttleHelper, deprecationWarning('throttle'))

export { takeEvery, takeLatest, throttle, takeEveryHelper, takeLatestHelper, throttleHelper }
