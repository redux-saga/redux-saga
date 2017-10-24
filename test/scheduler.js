import test from 'tape'
import { asap, flush, suspend } from '../src/internal/scheduler'

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
