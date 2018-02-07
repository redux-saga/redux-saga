function formatLocation(fileName, lineNumber) {
  return `${fileName}?${lineNumber}`
}

export function getLocation(instrumented) {
  return instrumented[Symbol.for('babel-plugin-transform-redux-saga-source')] || instrumented.__source || null
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

/**
    @param {saga, effect}[] sagaStack
    @returns {string}

    @example
    The above error occurred in task errorInPutSaga {pathToFile}
    when executing effect put({type: 'REDUCER_ACTION_ERROR_IN_PUT'}) {pathToFile}
        created by fetchSaga {pathToFile}
        created by rootSaga {pathToFile}
*/
export function sagaStackToString(sagaStack) {
  const [firstSaga, ...otherSagas] = sagaStack
  const crashedEffectLocation = firstSaga.effect ? effectLocationAsString(firstSaga.effect) : null
  const errorMessage = `The above error occurred in task ${sagaLocationAsString(firstSaga.meta)}${
    crashedEffectLocation ? ` \n when executing effect ${crashedEffectLocation}` : ''
  }`
  return [errorMessage, ...otherSagas.map(s => `    created by ${sagaLocationAsString(s.meta)}`)].join('\n')
}

export function addSagaStack(errorObject, errorStack) {
  errorObject.sagaStack = errorObject.sagaStack || []

  errorObject.sagaStack.push(errorStack)
}
