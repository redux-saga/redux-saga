import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
import deferred from '@redux-saga/deferred'
test('saga select/getState handling', () => {
  let actual = []
  const initialState = {
    counter: 0,
    arr: [1, 2],
  }

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

  const expected = [0, 0, 2, 1, 1]
  return Promise.resolve()
    .then(() => {
      def.resolve()
      store.dispatch({
        type: 'inc',
      })
    })
    .then(() => {
      return task.toPromise()
    })
    .then(() => {
      // should resolve getState and select effects
      expect(actual).toEqual(expected)
    })
})
