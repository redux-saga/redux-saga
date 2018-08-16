import sagaMiddleware, { END } from '../../src'
import { take, cancel, takeEvery } from '../../src/effects'
import { createStore, applyMiddleware } from 'redux'
test('takeEvery', () => {
  const loop = 10
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const mainTask = middleware.run(root)

  function* root() {
    const task = yield takeEvery('ACTION', worker, 'a1', 'a2')
    yield take('CANCEL_WATCHER')
    yield cancel(task)
  }

  function* worker(arg1, arg2, action) {
    actual.push([arg1, arg2, action.payload])
  }

  const inputTask = Promise.resolve()
    .then(() => {
      for (let i = 1; i <= loop / 2; i++)
        store.dispatch({
          type: 'ACTION',
          payload: i,
        })
    }) // the watcher should be cancelled after this
    // no further task should be forked after this
    .then(() =>
      store.dispatch({
        type: 'CANCEL_WATCHER',
      }),
    )
    .then(() => {
      for (let i = loop / 2 + 1; i <= loop; i++)
        store.dispatch({
          type: 'ACTION',
          payload: i,
        })
    })
  return Promise.all([mainTask.toPromise(), inputTask]).then(() => {
    // takeEvery must fork a worker on each action
    expect(actual).toEqual([['a1', 'a2', 1], ['a1', 'a2', 2], ['a1', 'a2', 3], ['a1', 'a2', 4], ['a1', 'a2', 5]])
  })
})
test('takeEvery: pattern END', () => {
  const middleware = sagaMiddleware()
  const store = createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainTask = middleware.run(saga)
  let task

  function* saga() {
    task = yield takeEvery('ACTION', fnToCall)
  }

  let called = false

  function* fnToCall() {
    called = true
  }

  store.dispatch(END)
  store.dispatch({
    type: 'ACTION',
  })
  return mainTask.toPromise().then(() => {
    // should finish takeEvery task on END
    expect(task.isRunning()).toBe(false) // should not call function if finished with END

    expect(called).toBe(false)
  })
})
