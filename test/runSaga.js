import test from 'tape'
import { createStore } from 'redux'

import { runSaga, storeIO } from '../src'
import { take, select } from '../src/effects'
import { noop } from '../src/utils'


test('storeIO: memoize results', assert => {
  assert.plan(1)

  const store = createStore(noop)

  assert.equal(storeIO(store), storeIO(store),
    'storeChannel must memoize results by store'
  )

})


test('runSaga', assert => {
  assert.plan(1)

  let actual = []
  function reducer(state = {}, action) {
    return action
  }
  const typeSelector = a => a.type

  const store = createStore(reducer)

  Promise.resolve(1)
    .then(() => store.dispatch({type: 'ACTION-0'}))
    .then(() => store.dispatch({type: 'ACTION-1'}))
    .then(() => store.dispatch({type: 'ACTION-2'}))

  function* gen() {
    actual.push( yield take('ACTION-0') )
    actual.push( yield select(typeSelector) )
    actual.push( yield take('ACTION-1') )
    actual.push( yield select(typeSelector) )
    actual.push( yield take('ACTION-2') )
    actual.push( yield select(typeSelector) )
  }

  const task = runSaga(gen(), storeIO(store))

  const expected = [
    {type: 'ACTION-0'}, 'ACTION-0',
    {type: 'ACTION-1'}, 'ACTION-1',
    {type: 'ACTION-2'}, 'ACTION-2'
  ]

  task.done.then(() =>
    assert.deepEqual(actual, expected,
      'runSaga must connect the provided iterator to the store, and run it'
    )
  )

  task.done.catch(err => assert.fail(err))

})
