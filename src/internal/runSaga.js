import { is, check, uid as nextSagaId, wrapSagaDispatch } from './utils'
import proc from './proc'

export function runSaga(
  iterator,
  {
    subscribe,
    dispatch,
    getState,
    sagaMonitor,
    logger,
    onError
  }
) {

  check(iterator, is.iterator, "runSaga must be called on an iterator")

  const effectId = nextSagaId()
  if(sagaMonitor) {
    dispatch = wrapSagaDispatch(dispatch)
    sagaMonitor.effectTriggered({effectId, root: true, parentEffectId: 0, effect: {root: true, saga: iterator, args:[]}})
  }
  const task = proc(
    iterator,
    subscribe,
    dispatch,
    getState,
    {sagaMonitor, logger, onError},
    effectId,
    iterator.name
  )

  if(sagaMonitor) {
    sagaMonitor.effectResolved(effectId, task)
  }

  return task
}
