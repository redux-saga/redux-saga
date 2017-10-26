import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { END } from '../../src'
import { deferred } from '../../src/utils'
import * as io from '../../src/effects'

test('saga race between effects handling', assert => {
  assert.plan(1)

  let actual = []
  const timeout = deferred()
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual.push(
      yield io.race({
        event: io.take('action'),
        timeout: timeout.promise,
      }),
    )
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => timeout.resolve(1))
    .then(() => store.dispatch({ type: 'action' }))

  const expected = [{ timeout: 1 }]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill race between effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga race between array of effects handling', assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const timeout = deferred()

  function* genFn() {
    actual.push(yield io.race([io.take('action'), timeout.promise]))
  }

  const task = middleware.run(genFn)

  Promise.resolve()
    .then(() => timeout.resolve(1))
    .then(() => store.dispatch({ type: 'action' }))

  // eslint-disable-next-line no-sparse-arrays
  const expected = [[, 1]]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must fullfill race between array of effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga race between effects: handle END', assert => {
  assert.plan(1)

  let actual = []
  const timeout = deferred()

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual.push(
      yield io.race({
        event: io.take('action'),
        timeout: timeout.promise,
      }),
    )
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => store.dispatch(END))
    .then(() => timeout.resolve(1))

  const expected = [{ timeout: 1 }]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must not resolve race effects with END')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test('saga race between sync effects', assert => {
  assert.plan(1)

  let actual = []

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    const xChan = yield io.actionChannel('x')
    const yChan = yield io.actionChannel('y')

    yield io.take('start')

    yield io.race({
      x: io.take(xChan),
      y: io.take(yChan),
    })

    yield Promise.resolve(1) // waiting for next tick

    actual.push(yield io.flush(xChan), yield io.flush(yChan))
  }

  const task = middleware.run(genFn)

  Promise.resolve(1)
    .then(() => store.dispatch({ type: 'x' }))
    .then(() => store.dispatch({ type: 'y' }))
    .then(() => store.dispatch({ type: 'start' }))

  const expected = [[], [{ type: 'y' }]]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga must not run effects when already completed')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
