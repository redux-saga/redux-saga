import test from 'tape';
import { runSaga } from '../src/runSaga'
import { createStore } from 'redux'
import { take } from '../src'
import { noop } from '../src/utils'

test('runSaga', assert => {
  assert.plan(1)

  let actual = []
  const store = createStore(noop)

  setTimeout(() => {
    Promise.resolve(1)
      .then(() => store.dispatch({type: 'ACTION-0'}))
      .then(() => store.dispatch({type: 'ACTION-1'}))
      .then(() => store.dispatch({type: 'ACTION-2'}))
  }, 16)

  function* gen() {
    actual.push( yield take('ACTION-0') )
    actual.push( yield take('ACTION-1') )
    actual.push( yield take('ACTION-2') )
  }

  const task = runSaga(gen(), store)

  const expected = [
    {type: 'ACTION-0'},
    {type: 'ACTION-1'},
    {type: 'ACTION-2'}
  ]

  task.done.then(() =>
    assert.deepEqual(actual, expected,
      'runSaga must connect the provided iterator to the store, and run it'
    )
  )

  task.done.catch(err => assert.fail(err))

})
