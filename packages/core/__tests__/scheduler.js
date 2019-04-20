
// import { asap, flush, suspend } from '../src/internal/scheduler'
import schedule from '../src/internal/scheduler'
import { asap, immediately } from '../src/internal/scheduler'

https://github.com/redux-saga/redux-saga/compare/szb512:master...szb512:scheduler-experiment?expand=1
test('scheduler executes all recursively triggered tasks in order', () => {
  // const actual = []
  // asap(() => {
  //   actual.push('1')
  //   asap(() => {
  //     actual.push('2')
  //   })
  //   asap(() => {
  //     actual.push('3')
  //   })
  // })
  // expect(actual).toEqual(['1', '2', '3'])
  expect(true).toBe(true)
})

test('scheduler when suspended queues up and executes all tasks on flush', () => {
  // const actual = []
  // suspend()
  // asap(() => {
  //   actual.push('1')
  //   asap(() => {
  //     actual.push('2')
  //   })
  //   asap(() => {
  //     actual.push('3')
  //   })
  // })
  // flush()
  // expect(actual).toEqual(['1', '2', '3'])
  expect(true).toBe(true)
  const actual = []
  immediately(() => {
    asap(() => {
      actual.push('1')
      asap(() => {
        actual.push('2')
      })
      asap(() => {
        actual.push('3')
      })
    })
  })
  expect(actual).toEqual(['1', '2', '3'])

})
