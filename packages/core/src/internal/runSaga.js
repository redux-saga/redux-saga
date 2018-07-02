import { compose } from 'redux'
import { is, check, uid as nextSagaId, wrapSagaDispatch, noop, log as _log } from './utils'
import proc, { getMetaInfo } from './proc'
import { stdChannel } from './channel'
import { allEffectMiddleware, raceEffectMiddleware, createSelectEffectMiddleware } from './common-effect-middlewares'

const RUN_SAGA_SIGNATURE = 'runSaga(options, saga, ...args)'
const NON_GENERATOR_ERR = `${RUN_SAGA_SIGNATURE}: saga argument must be a Generator function!`

function defaultRunCustomEffect({ type, cb }) {
  cb(new Error(`${type} is not a supported effect type`), true)
}

export function runSaga(options, saga, ...args) {
  if (process.env.NODE_ENV === 'development') {
    check(saga, is.func, NON_GENERATOR_ERR)
  }

  const iterator = saga(...args)

  if (process.env.NODE_ENV === 'development') {
    check(iterator, is.iterator, NON_GENERATOR_ERR)
  }

  const {
    channel = stdChannel(),
    dispatch,
    getState,
    context = {},
    sagaMonitor,
    logger,
    effectMiddlewares,
    onError,
  } = options

  const effectId = nextSagaId()

  if (sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop

    sagaMonitor.effectTriggered({ effectId, root: true, parentEffectId: 0, effect: { root: true, saga, args } })
  }

  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && is.notUndef(effectMiddlewares)) {
    const MIDDLEWARE_TYPE_ERROR = 'effectMiddlewares must be an array of functions'
    check(effectMiddlewares, is.array, MIDDLEWARE_TYPE_ERROR)
    effectMiddlewares.forEach(effectMiddleware => check(effectMiddleware, is.func, MIDDLEWARE_TYPE_ERROR))
  }

  if (process.env.NODE_ENV === 'development') {
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

  const middleware = effectMiddlewares && compose(...effectMiddlewares)
  const finalizeRunEffect = runEffect => {
    if (is.func(middleware)) {
      return function finalRunEffect(effect, effectId, currCb) {
        const plainRunEffect = eff => runEffect(eff, effectId, currCb)
        return middleware(plainRunEffect)(effect)
      }
    } else {
      return runEffect
    }
  }

  if (is.notUndef(getState)) {
    if (process.env.NODE_ENV === 'development') {
      check(getState, is.func, 'getState must be a function')
    }
  }
  const customEffectMiddlewares = [allEffectMiddleware, raceEffectMiddleware, createSelectEffectMiddleware(getState)]
  const runCustomEffect = compose(...customEffectMiddlewares)(defaultRunCustomEffect)

  const env = {
    stdChannel: channel,
    dispatch: wrapSagaDispatch(dispatch),
    sagaMonitor,
    logError,
    onError,
    finalizeRunEffect,
    runCustomEffect,
  }

  const task = proc(env, iterator, context, effectId, getMetaInfo(saga), null)

  if (sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task)
  }

  return task
}
