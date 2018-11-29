// there can be only a single saga error created at any given moment
// so this module acts as a singleton for bookkeeping it
import { getLocation, flatMap } from './utils'

function formatLocation(fileName, lineNumber) {
  return `${fileName}?${lineNumber}`
}

function effectLocationAsString(effect) {
  const location = getLocation(effect)
  if (location) {
    const { code, fileName, lineNumber } = location
    const source = `${code}  ${formatLocation(fileName, lineNumber)}`
    return source
  }
  return ''
}

function sagaLocationAsString(sagaMeta) {
  const { name, location } = sagaMeta
  if (location) {
    return `${name}  ${formatLocation(location.fileName, location.lineNumber)}`
  }
  return name
}

function cancelledTasksAsString(sagaStack) {
  const cancelledTasks = flatMap(i => i.cancelledTasks, sagaStack)
  if (!cancelledTasks.length) {
    return ''
  }
  return ['Tasks cancelled due to error:', ...cancelledTasks].join('\n')
}

const UNIQUE = {}
let crashedEffect = UNIQUE
const sagaStack = []

export const addSagaFrame = frame => {
  sagaStack.push(frame)
}

export const clear = () => {
  crashedEffect = UNIQUE
  sagaStack.length = 0
}

export const setCrashedEffect = effect => {
  // track only first effect (the one which has caused the crash)
  if (crashedEffect !== UNIQUE) {
    return
  }
  crashedEffect = effect
}

/**
  @returns {string}

  @example
  The above error occurred in task errorInPutSaga {pathToFile}
  when executing effect put({type: 'REDUCER_ACTION_ERROR_IN_PUT'}) {pathToFile}
      created by fetchSaga {pathToFile}
      created by rootSaga {pathToFile}
*/
export const toString = () => {
  const [firstSaga, ...otherSagas] = sagaStack
  const crashedEffectLocation = crashedEffect ? effectLocationAsString(crashedEffect) : null
  const errorMessage = `The above error occurred in task ${sagaLocationAsString(firstSaga.meta)}${
    crashedEffectLocation ? ` \n when executing effect ${crashedEffectLocation}` : ''
  }`

  return [
    errorMessage,
    ...otherSagas.map(s => `    created by ${sagaLocationAsString(s.meta)}`),
    cancelledTasksAsString(sagaStack),
  ].join('\n')
}
