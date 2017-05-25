import test from 'tape'

import { take, put, race } from '../src/effects'
import { asap, flush, suspend } from '../src/internal/scheduler'

export const runSyncDispatchTest = (assert, store, runSaga) => {
  const actual = []

  assert.plan(1)

  runSaga(root)
  store.subscribe(() => {
    if (store.getState() === 'c') store.dispatch({ type: 'b', test: true })
  })
  store.dispatch({ type: 'a', test: true })

  function* root() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { a, b } = yield race({
        a: take('a'),
        b: take('b'),
      })

      actual.push(a ? a.type : b.type)

      if (a) {
        yield put({ type: 'c', test: true })
        continue
      }

      yield put({ type: 'd', test: true })
    }
  }

  Promise.resolve().then(() => {
    assert.deepEqual(actual, ['a', 'b'], "Sagas can't miss actions dispatched by store subscribers during put handling")
    assert.end()
  })
}

test('scheduler executes all recursively triggered tasks in order', assert => {
  const actual = []
  assert.plan(1)
  asap(() => {
    actual.push('1')
    asap(() => {
      actual.push('2')
    })
    asap(() => {
      actual.push('3')
    })
  })
  assert.deepEqual(actual, ['1', '2', '3'])
  assert.end()
})

test('scheduler when suspended queues up and executes all tasks on flush', assert => {
  const actual = []
  assert.plan(1)
  suspend()
  asap(() => {
    actual.push('1')
    asap(() => {
      actual.push('2')
    })
    asap(() => {
      actual.push('3')
    })
  })
  flush()
  assert.deepEqual(actual, ['1', '2', '3'])
  assert.end()
})
