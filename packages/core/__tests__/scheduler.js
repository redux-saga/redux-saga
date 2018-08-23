import { asap, flush, suspend } from '../src/internal/scheduler'
test('scheduler executes all recursively triggered tasks in order', () => {
  const actual = []
  asap(() => {
    actual.push('1')
    asap(() => {
      actual.push('2')
    })
    asap(() => {
      actual.push('3')
    })
  })
  expect(actual).toEqual(['1', '2', '3'])
})
test('scheduler when suspended queues up and executes all tasks on flush', () => {
  const actual = []
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
  expect(actual).toEqual(['1', '2', '3'])
})
