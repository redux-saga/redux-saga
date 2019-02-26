import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { END } from '../../src'
import deferred from '@redux-saga/deferred'
import * as io from '../../src/effects'
test('saga race between effects handling', () => {
  let resultOfRace = 'initial'
  const timeout = deferred()
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    resultOfRace = yield io.race({
      event: io.take('action'),
      timeout: timeout.promise,
    })
  }

  const task = middleware.run(genFn)
  const expected = {
    timeout: 1,
  }
  return Promise.resolve()
    .then(() => timeout.resolve(1))
    .then(() =>
      store.dispatch({
        type: 'action',
      }),
    )
    .then(() => task.toPromise())
    .then(() => {
      // saga must fulfill race between effects
      expect(resultOfRace).toEqual(expected)
    })
})
test('saga race between array of effects handling', () => {
  let actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const timeout = deferred()

  function* genFn() {
    actual.push(yield io.race([io.take('action'), timeout.promise]))
  }

  const task = middleware.run(genFn)
  // eslint-disable-next-line no-sparse-arrays
  const expected = [[, 1]]
  return Promise.resolve()
    .then(() => timeout.resolve(1))
    .then(() =>
      store.dispatch({
        type: 'action',
      }),
    )
    .then(() => task.toPromise())
    .then(() => {
      // saga must fulfill race between array of effects
      expect(actual).toEqual(expected)
    })
})
test('saga race between effects: handle END', () => {
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const timeout = deferred()
  let resultOfRace = 'initial'
  let called = false

  function* genFn() {
    called = true
    resultOfRace = yield io.race({
      event: io.take('action'),
      task: timeout.promise,
    })
  }

  const task = middleware.run(genFn)
  return Promise.resolve()
    .then(() => store.dispatch(END))
    .then(() => timeout.resolve(1))
    .then(() => task.toPromise())
    .then(() => {
      // should run saga
      expect(called).toBe(true) // saga must end Race Effect if one of the effects resolve with END

      expect(resultOfRace).toBe('initial')
    })
})
test('saga race between sync effects', () => {
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
    yield Promise.resolve() // waiting for next tick

    actual.push(yield io.flush(xChan), yield io.flush(yChan))
  }

  const task = middleware.run(genFn)
  const expected = [
    [],
    [
      {
        type: 'y',
      },
    ],
  ]

  return Promise.resolve()
    .then(() =>
      store.dispatch({
        type: 'x',
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'y',
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'start',
      }),
    )
    .then(() => {
      return task.toPromise()
    })
    .then(() => {
      // saga must not run effects when already completed
      expect(actual).toEqual(expected)
    })
})
test('saga race cancelling joined tasks', () => {
  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    yield io.race({
      join: io.join([
        yield io.fork(function*() {
          yield io.delay(10)
        }),
        yield io.fork(function*() {
          yield io.delay(100)
        }),
      ]),
      timeout: io.delay(50),
    })
  }

  const task = middleware.run(genFn)

  return Promise.resolve().then(() => task.toPromise())
})
