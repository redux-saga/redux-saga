import * as is from '@redux-saga/is'
import { compose } from 'redux'
import { check, uid as nextSagaId, wrapSagaDispatch, noop, log as _log, identity } from './utils'
import proc, { getMetaInfo } from './proc'
import { stdChannel } from './channel'
import { immediately } from './scheduler'

const RUN_SAGA_SIGNATURE = 'runSaga(options, saga, ...args)'
const NON_GENERATOR_ERR = `${RUN_SAGA_SIGNATURE}: saga argument must be a Generator function!`

export function runSaga(
  { channel = stdChannel(), dispatch, getState, context = {}, sagaMonitor, logger, effectMiddlewares, onError },
  saga,
  ...args
) {
  if (process.env.NODE_ENV !== 'production') {
    check(saga, is.func, NON_GENERATOR_ERR)
  }

  const iterator = saga(...args)

  if (process.env.NODE_ENV !== 'production') {
    check(iterator, is.iterator, NON_GENERATOR_ERR)
  }

  const effectId = nextSagaId()

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.rootSagaStarted = sagaMonitor.rootSagaStarted || noop
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop

    sagaMonitor.rootSagaStarted({ effectId, saga, args })
  }

  if (process.env.NODE_ENV !== 'production') {
    if (is.notUndef(dispatch)) {
      check(dispatch, is.func, 'dispatch must be a function')
    }

    if (is.notUndef(getState)) {
      check(getState, is.func, 'getState must be a function')
    }

    if (is.notUndef(effectMiddlewares)) {
      const MIDDLEWARE_TYPE_ERROR = 'effectMiddlewares must be an array of functions'
      check(effectMiddlewares, is.array, MIDDLEWARE_TYPE_ERROR)
      effectMiddlewares.forEach(effectMiddleware => check(effectMiddleware, is.func, MIDDLEWARE_TYPE_ERROR))
    }

    if (is.notUndef(onError)) {
      check(onError, is.func, 'onError must be a function')
    }
  }

  const log = logger || _log
  const logError = err => {
    log('error', err)
    if (err && err.sagaStack) {
      log('error', err.sagaStack)
    }
  }

  let finalizeRunEffect
  if (effectMiddlewares) {
    const middleware = compose(...effectMiddlewares)
    finalizeRunEffect = runEffect => {
      return (effect, effectId, currCb) => {
        const plainRunEffect = eff => runEffect(eff, effectId, currCb)
        return middleware(plainRunEffect)(effect)
      }
    }
  } else {
    finalizeRunEffect = identity
  }

  const env = {
    channel,
    dispatch: wrapSagaDispatch(dispatch),
    getState,
    sagaMonitor,
    logError,
    onError,
    finalizeRunEffect,
  }

  return immediately(() => {
    const task = proc(env, iterator, context, effectId, getMetaInfo(saga), /* isRoot */ true, noop)

    if (sagaMonitor) {
      sagaMonitor.effectResolved(effectId, task)
    }

    return task
  })
}
