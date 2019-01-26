import sagaMiddleware, { END } from '../../src'
import { createStore, applyMiddleware } from 'redux'
import { arrayOfDeferred } from '@redux-saga/deferred'
import { take, cancel, takeLatestPerKey } from '../../src/effects'
test('takeLatestPerKey', () => {
  const defs = arrayOfDeferred(6)
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function selectKey(action) {
    return action.payload.id
  }

  function* root() {
    const task = yield takeLatestPerKey('ACTION', worker, selectKey, 'a1', 'a2')
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(arg1, arg2, action) {
    const idx = action.payload.data - 1
    const response = yield defs[idx].promise
    actual.push([arg1, arg2, response])
  }

  return Promise.resolve()
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 1,
          data: 1,
        },
      })
    })
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 1,
          data: 2,
        },
      })
    })
    .then(() => defs[0].resolve('w-1'))
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 2,
          data: 4,
        },
      })
    })
    .then(() => defs[1].resolve('w-2'))
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 2,
          data: 3,
        },
      })
    })
    .then(() => defs[3].resolve('w-4'))
    .then(() => defs[2].resolve('w-3'))
    .then(() => {
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 1,
          data: 5,
        },
      })
      /*
        We immediately cancel the watcher after firing the action
        The watcher should be cancelled after this
        no further task should be forked
        the last forked task should also be cancelled
      */
      store.dispatch({
        type: 'CANCEL_WATCHER',
      })
    })
    .then(() => defs[3].resolve('w-5'))
    .then(() => {
      // this one should be ignored by the watcher
      store.dispatch({
        type: 'ACTION',
        payload: {
          id: 2,
          data: 6,
        },
      })
    })
    .then(() => {
      // takeLatestPerKey must cancel current task before forking a new task
      expect(actual).toEqual([['a1', 'a2', 'w-2'], ['a1', 'a2', 'w-3']])
    })
})
test('takeLatestPerKey: pattern END', () => {
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainTask = middleware.run(saga)
  let task

  function* saga() {
    task = yield takeLatestPerKey('ACTION', fnToCall, () => null)
  }

  let called = false

  function* fnToCall() {
    called = true
  }

  store.dispatch(END)
  store.dispatch({
    type: 'ACTION',
  })
  store.dispatch({
    type: 'ACTION',
  })
  return mainTask.toPromise().then(() => {
    // should finish takeLatestPerKey task on END
    expect(task.isRunning()).toBe(false) // should not call function if finished with END

    expect(called).toBe(false)
  })
})
