import { SAGA_LOCATION } from '@redux-saga/symbols'

function formatLocation(fileName, lineNumber) {
  return `${fileName}?${lineNumber}`
}

export function getLocation(instrumented) {
  return instrumented[SAGA_LOCATION]
}

export function getMetaInfo(fn) {
  return {
    name: fn.name || 'anonymous',
    location: getLocation(fn),
  }
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

const flatMap = (mapper, arr) => [].concat(...arr.map(mapper))

function cancelledTasksAsString(sagaStack) {
  const cancelledTasks = flatMap(i => i.cancelledTasks, sagaStack)
  if (!cancelledTasks.length) {
    return ''
  }
  return ['Tasks cancelled due to error:', ...cancelledTasks].join('\n')
}
/**
    @param {saga, effect}[] sagaStack
    @returns {string}

    @example
    The above error occurred in task errorInPutSaga {pathToFile}
    when executing effect put({type: 'REDUCER_ACTION_ERROR_IN_PUT'}) {pathToFile}
        created by fetchSaga {pathToFile}
        created by rootSaga {pathToFile}
*/
function sagaStackToString(sagaStack, crashedEffect) {
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

export class SagaError {
  constructor(originalError, crashedEffect) {
    this.originalError = originalError
    this.crashedEffect = crashedEffect
    this.sagaStack = []
  }
  add(errorStack) {
    this.sagaStack.push(errorStack)
    return this
  }
  getError() {
    return this.originalError
  }
  toString() {
    return sagaStackToString(this.sagaStack, this.crashedEffect)
  }
  static isErrorAlreadyWrapped(candidate) {
    return candidate instanceof SagaError
  }
}
