import test from 'tape';
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware, { runSaga } from '../src'
import { arrayOfDeffered } from '../src/utils'
import * as io from '../src/effects'

function createSagaMonitor (ids, effects, actions) {
  return {
    effectTriggered({effectId, parentEffectId, label, effect}) {
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
    }
  }
}

test('saga middleware monitoring', assert => {
  assert.plan(2)

  let ids = []
  let effects = {}
  let actions = []

  const storeAction = {type: 'STORE_ACTION'}
  const sagaAction = {type: 'SAGA_ACTION'}

  const apiDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then( () => apiDefs[0].resolve('api1') )
    .then( () => apiDefs[1].resolve('api2') )

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
        call: io.call(child)
      })
    } catch(e) {
      void(0)
    }
  }

  const sagaMonitor = createSagaMonitor(ids, effects, actions)
  const sagaMiddleware = createSagaMiddleware({sagaMonitor})
  const store  = createStore(
    () => ({}),
    applyMiddleware(sagaMiddleware)
  )

  store.dispatch(storeAction)

  const task = sagaMiddleware.run(main)
  task.done.catch(err => assert.fail(err))

  setTimeout(() => {

    const expectedEffects = {
      [ids[0]]: { parentEffectId: 0, label: undefined, effect: {root: true, saga: main, args: []}, result: task },
      [ids[1]]: { parentEffectId: ids[0], label: '', effect: io.call(api, 0), result: 'api1' },
      [ids[2]]: { parentEffectId: ids[0], label: '', effect: io.race({ action: io.take('action'), call: io.call(child) }), error: 'child error' },
      [ids[3]]: { parentEffectId: ids[2], label: 'action', effect: io.take('action'), cancelled: true },
      [ids[4]]: { parentEffectId: ids[2], label: 'call', effect: io.call(child), error: 'child error' },
      [ids[5]]: { parentEffectId: ids[4], label: '', effect: io.call(api, 1), result: 'api2' },
      [ids[6]]: { parentEffectId: ids[4], label: '', effect: io.put(sagaAction), result: sagaAction }
    }

    assert.deepEqual(
      effects,
      expectedEffects,
      'sagaMiddleware must notify the saga monitor of Effect creation and resolution'
    )

    const expectedActions = [storeAction, sagaAction]
    assert.deepEqual(
      actions,
      expectedActions,
      'sagaMiddleware must notify the saga monitor of dispatched actions'
    )

  })

});


test('runSaga monitoring', assert => {
  assert.plan(2)

  let ids = []
  let effects = {}
  let actions = []

  const sagaMonitor = createSagaMonitor(ids, effects, actions)

  let listener
  const subscribe = lis => {
    listener = lis
    return () => {}
  }
  const dispatch = action => {
    sagaMonitor.actionDispatched(action)
    listener(action)
    return action
  }

  const storeAction = {type: 'STORE_ACTION'}
  const sagaAction = {type: 'SAGA_ACTION'}

  const apiDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then( () => apiDefs[0].resolve('api1') )
    .then( () => apiDefs[1].resolve('api2') )

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
        call: io.call(child)
      })
    } catch(e) {
      void(0)
    }
  }

  const iterator = main()
  const task = runSaga(iterator, {subscribe, dispatch, sagaMonitor})
  task.done.catch(err => assert.fail(err))

  dispatch(storeAction)


  setTimeout(() => {

    const expectedEffects = {
      [ids[0]]: { parentEffectId: 0, label: undefined, effect: {root: true, saga: iterator, args: []}, result: task },
      [ids[1]]: { parentEffectId: ids[0], label: '', effect: io.call(api, 0), result: 'api1' },
      [ids[2]]: { parentEffectId: ids[0], label: '', effect: io.race({ action: io.take('action'), call: io.call(child) }), error: 'child error' },
      [ids[3]]: { parentEffectId: ids[2], label: 'action', effect: io.take('action'), cancelled: true },
      [ids[4]]: { parentEffectId: ids[2], label: 'call', effect: io.call(child), error: 'child error' },
      [ids[5]]: { parentEffectId: ids[4], label: '', effect: io.call(api, 1), result: 'api2' },
      [ids[6]]: { parentEffectId: ids[4], label: '', effect: io.put(sagaAction), result: sagaAction }
    }

    assert.deepEqual(
      effects[ids[6]],
      expectedEffects[ids[6]],
      'runSaga must notify the saga monitor of Effect creation and resolution'
    )

    const expectedActions = [storeAction, sagaAction]
    assert.deepEqual(
      actions,
      expectedActions,
      'runSaga must notify the saga monitor of dispatched actions'
    )

  })

});

test('saga monitors without all functions', assert => {
  assert.plan(1)

  const storeAction = {type: 'STORE_ACTION'}
  const sagaAction = {type: 'SAGA_ACTION'}

  const apiDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then( () => apiDefs[0].resolve('api1') )
    .then( () => apiDefs[1].resolve('api2') )

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
        call: io.call(child)
      })
    } catch(e) {
      void(0)
    }
  }

  // let's create an empty object
  const sagaMonitor = {}
  const sagaMiddleware = createSagaMiddleware({sagaMonitor})
  const store  = createStore(
    () => ({}),
    applyMiddleware(sagaMiddleware)
  )

  store.dispatch(storeAction)

  const task = sagaMiddleware.run(main)
  task.done.catch(err => assert.fail(err))

  setTimeout(() => {
    // did we survive?
    assert.pass('given noops to fulfill the monitor interface')
  })

});

