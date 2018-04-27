import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
import { deferred } from '../../src/utils'

test('saga select/getState handling', assert => {
  assert.plan(1)

  let actual = []

  const initialState = { counter: 0, arr: [1, 2] }
  const counterSelector = s => s.counter
  const arrSelector = (s, idx) => s.arr[idx]
  const def = deferred()

  const rootReducer = (state, action) => {
    if (action.type === 'inc') {
      return {
        ...state,
        counter: state.counter + 1,
      }
    }
    return state
  }

  const middleware = sagaMiddleware()
  const store = createStore(rootReducer, initialState, applyMiddleware(middleware))

  function* genFn() {
    actual.push((yield io.select()).counter)
    actual.push(yield io.select(counterSelector))
    actual.push(yield io.select(arrSelector, 1))
    yield def.promise

    actual.push((yield io.select()).counter)
    actual.push(yield io.select(counterSelector))
  }

  const task = middleware.run(genFn)

  Promise.resolve().then(() => {
    def.resolve()
    store.dispatch({ type: 'inc' })
  })

  const expected = [0, 0, 2, 1, 1]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'should resolve getState and select effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})

test("saga handles select's synchronous failures", assert => {
  assert.plan(1)

  let actual = []
  const error = new Error('error')

  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    try {
      yield io.select(() => {
        throw error
      })
    } catch (err) {
      actual.push(err)
    }
  }

  const task = middleware.run(genFn)

  const expected = [error]

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(actual, expected, 'saga should bubble thrown errors of generator select effects')
      assert.end()
    })
    .catch(err => assert.fail(err))
})
