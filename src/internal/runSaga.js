import { is, check, uid as nextSagaId, wrapSagaDispatch, noop, log } from './utils'
import proc from './proc'

const RUN_SAGA_SIGNATURE = 'runSaga(storeInterface, saga, ...args)'
const NON_GENERATOR_ERR = `${ RUN_SAGA_SIGNATURE }: saga argument must be a Generator function!`

export function runSaga(
  storeInterface,
  saga,
  ...args
) {
  let iterator

  if (is.iterator(storeInterface)) {
    if (process.env.NODE_ENV === 'development') {
      log('warn', `runSaga(iterator, storeInterface) has been deprecated in favor of ${ RUN_SAGA_SIGNATURE }`)
    }
    iterator = storeInterface
    storeInterface = saga
  } else {
    check(saga, is.func, NON_GENERATOR_ERR)
    iterator = saga(...args)
    check(iterator, is.iterator, NON_GENERATOR_ERR)
  }

  const {
    subscribe,
    dispatch,
    getState,
    context,
    sagaMonitor,
    logger,
    onError
  } = storeInterface

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
    context,
    {sagaMonitor, logger, onError},
    effectId,
    saga.name
  )

  if(sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task)
  }

  return task
}
