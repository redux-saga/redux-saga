/* eslint-disable no-console */
import * as is from '@redux-saga/is'
import { CANCELLED, IS_BROWSER, PENDING, REJECTED, RESOLVED } from './modules/constants'
import { isRaceEffect } from './modules/checkers'
import logSaga from './modules/logSaga'
import Manager from './modules/Manager'

const globalScope =
  typeof window.document === 'undefined' && navigator.product === 'ReactNative' ? global : IS_BROWSER ? window : null

// `VERBOSE` can be made a setting configured from the outside.
const VERBOSE = false

function time() {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  } else {
    return Date.now()
  }
}

const manager = new Manager()

function rootSagaStarted(desc) {
  if (VERBOSE) {
    console.log('Root saga started:', desc.saga.name || 'anonymous', desc.args)
  }
  manager.setRootEffect(
    desc.effectId,
    Object.assign({}, desc, {
      status: PENDING,
      start: time(),
    }),
  )
}

function effectTriggered(desc) {
  if (VERBOSE) {
    console.log('Saga monitor: effectTriggered:', desc)
  }
  manager.set(
    desc.effectId,
    Object.assign({}, desc, {
      status: PENDING,
      start: time(),
    }),
  )
}

function effectResolved(effectId, result) {
  if (VERBOSE) {
    console.log('Saga monitor: effectResolved:', effectId, result)
  }
  resolveEffect(effectId, result)
}

function effectRejected(effectId, error) {
  if (VERBOSE) {
    console.log('Saga monitor: effectRejected:', effectId, error)
  }
  rejectEffect(effectId, error)
}

function effectCancelled(effectId) {
  if (VERBOSE) {
    console.log('Saga monitor: effectCancelled:', effectId)
  }
  cancelEffect(effectId)
}

function computeEffectDur(effect) {
  const now = time()
  Object.assign(effect, {
    end: now,
    duration: now - effect.start,
  })
}

function resolveEffect(effectId, result) {
  const effect = manager.get(effectId)

  if (is.task(result)) {
    result.toPromise().then(
      taskResult => {
        if (result.isCancelled()) {
          cancelEffect(effectId)
        } else {
          resolveEffect(effectId, taskResult)
        }
      },
      taskError => rejectEffect(effectId, taskError),
    )
  } else {
    computeEffectDur(effect)
    effect.status = RESOLVED
    effect.result = result
    if (isRaceEffect(effect.effect)) {
      setRaceWinner(effectId, result)
    }
  }
}

function rejectEffect(effectId, error) {
  const effect = manager.get(effectId)
  computeEffectDur(effect)
  effect.status = REJECTED
  effect.error = error
  if (isRaceEffect(effect.effect)) {
    setRaceWinner(effectId, error)
  }
}

function cancelEffect(effectId) {
  const effect = manager.get(effectId)
  computeEffectDur(effect)
  effect.status = CANCELLED
}

function setRaceWinner(raceEffectId, result) {
  const winnerLabel = Object.keys(result)[0]
  for (const childId of manager.getChildIds(raceEffectId)) {
    const childEffect = manager.get(childId)
    if (childEffect.label === winnerLabel) {
      childEffect.winner = true
    }
  }
}

// Export the snapshot-logging function to run from the browser console or extensions.
if (globalScope) {
  console.log('Enter `$$LogSagas()` to print the monitor log')
  globalScope.$$LogSagas = () => logSaga(manager)
}

// Export the snapshot-logging function for arbitrary use by external code.
export { logSaga }

// Export the `sagaMonitor` to pass to the middleware.
export default {
  rootSagaStarted,
  effectTriggered,
  effectResolved,
  effectRejected,
  effectCancelled,
  actionDispatched: () => {},
}
