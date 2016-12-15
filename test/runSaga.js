import test from 'tape'

import { runSaga } from '../src'
import { fork, take, put, select } from '../src/effects'
import { emitter } from '../src/internal/channel'
import { runSyncDispatchTest } from './scheduler'

function storeLike(reducer, state) {
  const em = emitter()

  return {
    subscribe: em.subscribe,
    dispatch: (action) => {
      state = reducer(state, action)
      em.emit(action)
      return action
    },
    getState: () => state
  }
}

test('runSaga', assert => {
  assert.plan(1)

  let actual = []
  function reducer(state = {}, action) {
    return action
  }
  const store = storeLike(reducer, {})
  const typeSelector = a => a.type
  const task = runSaga(root(), store)

  store.dispatch({type: 'ACTION-1'})
  store.dispatch({type: 'ACTION-2'})

  function* root() {
    yield [fork(fnA), fork(fnB)]
  }

  function* fnA() {
    actual.push( yield take('ACTION-1') )
    actual.push( yield select(typeSelector) )
    actual.push( yield take('ACTION-2') )
    actual.push( yield select(typeSelector) )
    yield put({type: 'ACTION-3'})
  }

  function* fnB() {
    actual.push( yield take('ACTION-3') )
    actual.push( yield select(typeSelector) )
  }

  const expected = [
    {type: 'ACTION-1'}, 'ACTION-1',
    {type: 'ACTION-2'}, 'ACTION-2',
    {type: 'ACTION-3'}, 'ACTION-3'
  ]

  task.done.then(() =>
    assert.deepEqual(actual, expected,
      'runSaga must connect the provided iterator to the store, and run it'
    )
  )

  task.done.catch(err => assert.fail(err))
})

test('put causing sync dispatch response in store-like subscriber', assert => {
  const reducer = (state, action) => action.type
  const store = storeLike(reducer, {})

  runSyncDispatchTest(assert, store, (saga) => runSaga(saga(), store))
});
