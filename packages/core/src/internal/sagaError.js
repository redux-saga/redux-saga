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

let crashedEffect = null
const sagaStack = []

export const addSagaFrame = frame => {
  frame.crashedEffect = crashedEffect
  sagaStack.push(frame)
}

export const clear = () => {
  crashedEffect = null
  sagaStack.length = 0
}

// this sets crashed effect for the soon-to-be-reported saga frame
// this slightly streatches the singleton nature of this module into wrong direction
// as it's even less obvious what's the data flow here, but it is what it is for now
export const setCrashedEffect = effect => {
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
  const crashedEffectLocation = firstSaga.crashedEffect ? effectLocationAsString(firstSaga.crashedEffect) : null
  const errorMessage = `The above error occurred in task ${sagaLocationAsString(firstSaga.meta)}${
    crashedEffectLocation ? ` \n when executing effect ${crashedEffectLocation}` : ''
  }`

  return [
    errorMessage,
    ...otherSagas.map(s => `    created by ${sagaLocationAsString(s.meta)}`),
    cancelledTasksAsString(sagaStack),
  ].join('\n')
}
