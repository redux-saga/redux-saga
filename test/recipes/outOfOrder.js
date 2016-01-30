import test from 'tape';
import proc from '../../src/proc'
import { put, fork } from '../../src'
import { arrayOfDeffered } from '../../src/utils'

/**
  Purpose:
    Handling out of order responses from tasks

  Problem:
    Sometimes concurrent tasks are forked, but we want to make sure
    to resolve their end results in the same order in whichthey were
    fired. For example GET requests should resolve with the data from
    the latest fired request

  Test:
    We fire 3 consecutive tasks concurrently
    We resolve the end results after some delay with an aribitary order

  Expected results
    Since the 3 tasks are fired concurrently, we should only
    get the result of the latest fired task
**/

const DELAY = 50

test('Recipes: Out of order responses handling', assert => {
  assert.plan(1)

  let actual = []
  const defs = arrayOfDeffered(3)

  setTimeout(() => {
    Promise.resolve(1)
      .then(() => defs[2].resolve('two'))
      .then(() => defs[0].resolve('zero'))
      .then(() => defs[1].resolve('one'))
  }, 16)

  const dispatch = out => actual.push(out)

  function* watchFetch() {

    let lastTaskId = 0
    while (lastTaskId < 3) {
      lastTaskId++
      yield put( `fork ${lastTaskId}` )
      yield fork(fetch, lastTaskId)

    }

    function* fetch(taskId) {
      const result = yield defs[taskId-1].promise
      if(taskId === lastTaskId)
        yield put( result )
    }
  }

  const expected = ['fork 1', 'fork 2', 'fork 3', 'two']
  proc(watchFetch(), undefined, dispatch).done.catch(err => assert.fail(err))
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      'Should fire only the last received response from concurrent (forked) requests'
    )
  }, DELAY)

})
