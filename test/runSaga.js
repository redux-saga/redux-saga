import test from 'tape'

import { runSaga, stdChannel } from '../src'
import { fork, take, put, select, all } from '../src/effects'

// TODO: effectMiddleware is not store-like, this shouldnt be here
// its completely different feature
// changes to this file should be completely reverted
// middleware feature should get separate tests
function storeLike(reducer, state, effectMiddleware) {
  const channel = stdChannel()

  return {
    channel,
    dispatch: action => {
      state = reducer(state, action)
      channel.put(action)
      return action
    },
    getState: () => state,
    effectMiddleware,
  }
}

test('runSaga', assert => {
  assert.plan(1)

  let actual = []
  function reducer(state = {}, action) {
    return action
  }
  const forkB = fork(fnB)
  const forkThunk = fork(thunk)
  const effectMiddleware = next => effect => {
    if (effect === forkThunk) {
      next(forkB)
      return
    }
    return next(effect)
  }
  const store = storeLike(reducer, {}, effectMiddleware)
  const typeSelector = a => a.type
  const task = runSaga(store, root)

  function* root() {
    yield all([fork(fnA), forkThunk])
  }

  function* fnA() {
    actual.push(yield take('ACTION-1'))
    actual.push(yield select(typeSelector))
    actual.push(yield take('ACTION-2'))
    actual.push(yield select(typeSelector))
    yield put({ type: 'ACTION-3' })
  }

  function* fnB() {
    actual.push(yield take('ACTION-3'))
    actual.push(yield select(typeSelector))
  }

  function thunk() {}

  Promise.resolve()
    .then(() => store.dispatch({ type: 'ACTION-1' }))
    .then(() => store.dispatch({ type: 'ACTION-2' }))

  const expected = [
    { type: 'ACTION-1' },
    'ACTION-1',
    { type: 'ACTION-2' },
    'ACTION-2',
    { type: 'ACTION-3' },
    'ACTION-3',
  ]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'runSaga must connect the provided iterator to the store, and run it')
    })
    .catch(err => assert.fail(err))
})
