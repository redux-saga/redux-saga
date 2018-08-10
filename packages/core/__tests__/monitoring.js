import { arrayOfDeferred } from '@redux-saga/deferred'
import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware, { runSaga, stdChannel } from '../src'
import { root } from '../src/internal/io'
import * as io from '../src/effects'

function createSagaMonitor(ids, effects, actions) {
  return {
    effectTriggered({ effectId, parentEffectId, label, effect }) {
      ids.push(effectId)
      effects[effectId] = { parentEffectId, label, effect }
    },

    effectResolved(effectId, res) {
      effects[effectId].result = res
    },

    effectRejected(effectId, err) {
      effects[effectId].error = err
    },

    effectCancelled(effectId) {
      effects[effectId].cancelled = true
    },

    actionDispatched(action) {
      actions.push(action)
    },
  }
}

test('saga middleware monitoring', async () => {
  let ids = []
  let effects = {}
  let actions = []
  const storeAction = { type: 'STORE_ACTION' }
  const sagaAction = { type: 'SAGA_ACTION' }
  const apiDefs = arrayOfDeferred(2)
  Promise.resolve(1)
    .then(() => apiDefs[0].resolve('api1'))
    .then(() => apiDefs[1].resolve('api2'))

  function api(idx) {
    return apiDefs[idx].promise
  }

  function* child() {
    yield io.call(api, 1)
    yield io.put(sagaAction)
    throw 'child error'
  }

  function* main() {
    try {
      yield io.call(api, 0)
      yield io.race({
        action: io.take('action'),
        call: io.call(child),
      })
    } catch (e) {
      void 0
    }
  }

  const sagaMonitor = createSagaMonitor(ids, effects, actions)
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  const store = createStore(() => ({}), applyMiddleware(sagaMiddleware))
  store.dispatch(storeAction)
  const task = sagaMiddleware.run(main)
  await task.toPromise()

  const expectedEffects = {
    [ids[0]]: { parentEffectId: 0, label: undefined, effect: root(main, []), result: task },
    [ids[1]]: { parentEffectId: ids[0], label: '', effect: io.call(api, 0), result: 'api1' },
    [ids[2]]: {
      parentEffectId: ids[0],
      label: '',
      effect: io.race({ action: io.take('action'), call: io.call(child) }),
      error: 'child error',
    },
    [ids[3]]: { parentEffectId: ids[2], label: 'action', effect: io.take('action'), cancelled: true },
    [ids[4]]: { parentEffectId: ids[2], label: 'call', effect: io.call(child), error: 'child error' },
    [ids[5]]: { parentEffectId: ids[4], label: '', effect: io.call(api, 1), result: 'api2' },
    [ids[6]]: { parentEffectId: ids[4], label: '', effect: io.put(sagaAction), result: sagaAction },
  }

  // sagaMiddleware must notify the saga monitor of Effect creation and resolution
  expect(effects).toEqual(expectedEffects)

  // sagaMiddleware must notify the saga monitor of dispatched actions
  expect(actions).toEqual([storeAction, sagaAction])
})

test('runSaga monitoring', async () => {
  let ids = []
  let effects = {}
  let actions = []
  const sagaMonitor = createSagaMonitor(ids, effects, actions)
  const channel = stdChannel()

  const dispatch = action => {
    sagaMonitor.actionDispatched(action)
    return action
  }

  const storeAction = { type: 'STORE_ACTION' }
  const sagaAction = { type: 'SAGA_ACTION' }

  const apiDefs = arrayOfDeferred(2)

  Promise.resolve(1)
    .then(() => apiDefs[0].resolve('api1'))
    .then(() => apiDefs[1].resolve('api2'))

  function api(idx) {
    return apiDefs[idx].promise
  }

  function* child() {
    yield io.call(api, 1)
    yield io.put(sagaAction)
    throw 'child error'
  }

  function* main() {
    try {
      yield io.call(api, 0)
      yield io.race({
        action: io.take('action'),
        call: io.call(child),
      })
    } catch (e) {
      void 0
    }
  }

  let iterator
  const task = runSaga(
    {
      channel,
      dispatch,
      sagaMonitor,
    },
    () => (iterator = main()),
  )
  dispatch(storeAction)

  await task.toPromise()

  const expectedEffects = {
    [ids[0]]: {
      parentEffectId: 0,
      label: undefined,
      effect: { root: true, saga: iterator, args: [] },
      result: task,
    },
    [ids[1]]: { parentEffectId: ids[0], label: '', effect: io.call(api, 0), result: 'api1' },
    [ids[2]]: {
      parentEffectId: ids[0],
      label: '',
      effect: io.race({ action: io.take('action'), call: io.call(child) }),
      error: 'child error',
    },
    [ids[3]]: { parentEffectId: ids[2], label: 'action', effect: io.take('action'), cancelled: true },
    [ids[4]]: { parentEffectId: ids[2], label: 'call', effect: io.call(child), error: 'child error' },
    [ids[5]]: { parentEffectId: ids[4], label: '', effect: io.call(api, 1), result: 'api2' },
    [ids[6]]: { parentEffectId: ids[4], label: '', effect: io.put(sagaAction), result: sagaAction },
  }
  // runSaga must notify the saga monitor of Effect creation and resolution
  expect(effects[ids[6]]).toEqual(expectedEffects[ids[6]])

  const expectedActions = [storeAction, sagaAction]
  // runSaga must notify the saga monitor of dispatched actions
  expect(actions).toEqual(expectedActions)
})

test('saga monitors without all functions', async () => {
  const storeAction = { type: 'STORE_ACTION' }
  const sagaAction = { type: 'SAGA_ACTION' }

  const apiDefs = arrayOfDeferred(2)

  Promise.resolve(1)
    .then(() => apiDefs[0].resolve('api1'))
    .then(() => apiDefs[1].resolve('api2'))

  function api(idx) {
    return apiDefs[idx].promise
  }

  function* child() {
    yield io.call(api, 1)
    yield io.put(sagaAction)
    throw 'child error'
  }

  function* main() {
    try {
      yield io.call(api, 0)
      yield io.race({
        action: io.take('action'),
        call: io.call(child),
      })
    } catch (e) {
      void 0
    }
    return 'success'
  }

  // let's create an empty object
  const sagaMonitor = {}
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  const store = createStore(() => ({}), applyMiddleware(sagaMiddleware))
  store.dispatch(storeAction)
  const task = sagaMiddleware.run(main)
  // given noops to fulfill the monitor interface we have survived
  const taskResult = await task.toPromise()
  expect(taskResult).toBe('success')
})
