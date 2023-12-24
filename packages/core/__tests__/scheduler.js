import { asap, immediately } from '../src/internal/scheduler'

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

test('scheduler queues a task and flush1', () => {
  const actual = []
  asap(() => {
    actual.push('1')
    asap(() => {
      actual.push('3')
    })
    actual.push('2')
  })
  expect(actual).toEqual(['1', '2', '3'])
})

test('scheduler queues a task and flush2', () => {
  const actual = []
  asap(() => {
    asap(() => {
      asap(() => {
        actual.push('3')
      })
      actual.push('2')
    })
    actual.push('1')
  })
  expect(actual).toEqual(['1', '2', '3'])
})

test('scheduler queues a task and flush3', () => {
  const actual = []
  immediately(() => {
    actual.push('1')
    asap(() => {
      actual.push('3')
    })
    actual.push('2')
  })
  expect(actual).toEqual(['1', '2', '3'])
})

test('scheduler queues a task and flush4', () => {
  const actual = []
  immediately(() => {
    asap(() => {
      asap(() => {
        actual.push('3')
      })
      actual.push('2')
    })
    actual.push('1')
  })
  expect(actual).toEqual(['1', '2', '3'])
})
