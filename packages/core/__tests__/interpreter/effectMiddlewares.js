import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { call, take, all } from '../../src/effects'
test('effectMiddlewares - single', () => {
  let actual = []

  function rootReducer(state, action) {
    return action
  }

  const effectMiddleware = next => effect => {
    if (effect === apiCall) {
      Promise.resolve().then(() => next('injected value'))
      return
    }

    return next(effect)
  }

  const middleware = sagaMiddleware({
    effectMiddlewares: [effectMiddleware],
  })
  const store = createStore(rootReducer, {}, applyMiddleware(middleware))
  const apiCall = call(() => new Promise(() => {}))

  function* root() {
    actual.push(yield all([call(fnA), apiCall]))
  }

  function* fnA() {
    const result = []
    result.push((yield take('ACTION-1')).val)
    result.push((yield take('ACTION-2')).val)
    return result
  }

  const task = middleware.run(root)
  Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'ACTION-1',
        val: 1,
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'ACTION-2',
        val: 2,
      }),
    )
  const expected = [[[1, 2], 'injected value']]
  return task.toPromise().then(() => {
    // effectMiddleware must be able to intercept and resolve effect in a custom way
    expect(actual).toEqual(expected)
  })
})
test('effectMiddlewares - multiple', () => {
  let actual = []

  function rootReducer(state, action) {
    return action
  }

  const effectMiddleware1 = next => effect => {
    actual.push('middleware1 received', effect)

    if (effect === apiCall1) {
      Promise.resolve().then(() => next('middleware1 injected value'))
      return
    }

    actual.push('middleware1 passed trough', effect)
    return next(effect)
  }

  const effectMiddleware2 = next => effect => {
    actual.push('middleware2 received', effect)

    if (effect === apiCall2) {
      Promise.resolve().then(() => next('middleware2 injected value'))
      return
    }

    actual.push('middleware2 passed trough', effect)
    return next(effect)
  }

  const middleware = sagaMiddleware({
    effectMiddlewares: [effectMiddleware1, effectMiddleware2],
  })
  createStore(rootReducer, {}, applyMiddleware(middleware))
  const apiCall1 = call(() => new Promise(() => {}))
  const apiCall2 = call(() => new Promise(() => {}))
  const callA = call(fnA)

  function* root() {
    actual.push("effect's result is", yield apiCall1)
    actual.push("effect's result is", yield callA)
    actual.push("effect's result is", yield apiCall2)
  }

  function* fnA() {
    return 'fnA result'
  }

  const task = middleware.run(root)
  const expected = [
    'middleware1 received',
    apiCall1,
    'middleware2 received',
    'middleware1 injected value',
    'middleware2 passed trough',
    'middleware1 injected value',
    "effect's result is",
    'middleware1 injected value',
    'middleware1 received',
    callA,
    'middleware1 passed trough',
    callA,
    'middleware2 received',
    callA,
    'middleware2 passed trough',
    callA,
    "effect's result is",
    'fnA result',
    'middleware1 received',
    apiCall2,
    'middleware1 passed trough',
    apiCall2,
    'middleware2 received',
    apiCall2,
    "effect's result is",
    'middleware2 injected value',
  ]
  return task.toPromise().then(() => {
    // multiple effectMiddlewares must create a chain
    expect(actual).toEqual(expected)
  })
})
test('effectMiddlewares - nested task', () => {
  let actual = []

  function rootReducer(state, action) {
    return action
  }

  const effectMiddleware = next => effect => {
    if (effect === apiCall) {
      Promise.resolve().then(() => next('injected value'))
      return
    }

    return next(effect)
  }

  const middleware = sagaMiddleware({
    effectMiddlewares: [effectMiddleware],
  })
  const store = createStore(rootReducer, {}, applyMiddleware(middleware))
  const apiCall = call(() => new Promise(() => {}))

  function* root() {
    actual.push(yield call(fnA))
  }

  function* fnA() {
    actual.push((yield take('ACTION-1')).val)
    actual.push((yield take('ACTION-2')).val)
    actual.push(yield apiCall)
    return 'result'
  }

  const task = middleware.run(root)
  Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'ACTION-1',
        val: 1,
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'ACTION-2',
        val: 2,
      }),
    )
  const expected = [1, 2, 'injected value', 'result']
  return task.toPromise().then(() => {
    // effectMiddleware must be able to intercept effects from non-root sagas
    expect(actual).toEqual(expected)
  })
})
