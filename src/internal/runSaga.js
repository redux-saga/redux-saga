import { is, check, uid as nextSagaId, wrapSagaDispatch, noop, log, isDev } from './utils'
import proc from './proc'

export function runSaga(
  saga,
  {
    subscribe,
    dispatch,
    getState,
    sagaMonitor,
    logger,
    onError
  },
  ...args
) {
  let iterator
  if (!is.iterator(saga)) {
    check(saga, is.func, 'runSaga(saga, storeInterface, ...args): saga argument must be a Generator function!')
    iterator = saga(...args)
  } else {
    if (isDev) {
      log('warn', 'runSaga(iterator) has been deprecated in favor of runSaga(sagaGenerator)')
    }
    iterator = saga
  }

  const effectId = nextSagaId()

  if(sagaMonitor) {
    // monitors are expected to have a certain interface, let's fill-in any missing ones
    sagaMonitor.effectTriggered = sagaMonitor.effectTriggered || noop
    sagaMonitor.effectResolved = sagaMonitor.effectResolved || noop
    sagaMonitor.effectRejected = sagaMonitor.effectRejected || noop
    sagaMonitor.effectCancelled = sagaMonitor.effectCancelled || noop
    sagaMonitor.actionDispatched = sagaMonitor.actionDispatched || noop

    sagaMonitor.effectTriggered({effectId, root: true, parentEffectId: 0, effect: {root: true, saga, args}})
  }

  const task = proc(
    iterator,
    subscribe,
    wrapSagaDispatch(dispatch),
    getState,
    {sagaMonitor, logger, onError},
    effectId,
    saga.name
  )

  if(sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task)
  }

  return task
}
