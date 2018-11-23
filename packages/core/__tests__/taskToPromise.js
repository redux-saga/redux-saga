import { TASK_CANCEL } from '@redux-saga/symbols'
import { runSaga, stdChannel } from '../src'
import { cancel, delay, fork } from '../src/effects'
import { noop } from '../src/internal/utils'

function simpleRunSaga(saga) {
  const channel = stdChannel()
  return runSaga({ channel, dispatch: channel.put, onError: noop }, saga)
}

test('calling toPromise() of an already completed task', () => {
  const result = 'result-of-saga'

  const task = simpleRunSaga(function* saga() {
    return result
  })
  expect(task.isRunning()).toBe(false)
  return expect(task.toPromise()).resolves.toBe(result)
})

test('calling toPromise() before a task completes', () => {
  const result = 'result-of-saga'

  const task = simpleRunSaga(function* saga() {
    yield delay(10)
    return result
  })
  expect(task.isRunning()).toBe(true)
  return expect(task.toPromise()).resolves.toBe(result)
})

test('calling toPromise() of an already aborted task', () => {
  const error = new Error('test-error')

  const task = simpleRunSaga(function* saga() {
    throw error
  })
  expect(task.isRunning()).toBe(false)
  return expect(task.toPromise()).rejects.toBe(error)
})

test('calling toPromise() before a task aborts', () => {
  const error = new Error('test-error')

  const task = simpleRunSaga(function* saga() {
    yield delay(10)
    throw error
  })
  expect(task.isRunning()).toBe(true)
  return expect(task.toPromise()).rejects.toBe(error)
})

test('calling toPromise() of an already cancelled task', async () => {
  let child

  simpleRunSaga(function* saga() {
    child = yield fork(function* child() {
      yield delay(10000)
    })
    yield cancel(child)
  })

  expect(child.isRunning()).toBe(false)
  return expect(child.toPromise()).resolves.toBe(TASK_CANCEL)
})

test('calling toPromise() of before a task gets cancelled', async () => {
  let child

  simpleRunSaga(function* saga() {
    child = yield fork(function* child() {
      yield delay(10000)
    })
    yield delay(10)
    yield cancel(child)
  })

  expect(child.isRunning()).toBe(true)
  return expect(child.toPromise()).resolves.toBe(TASK_CANCEL)
})
