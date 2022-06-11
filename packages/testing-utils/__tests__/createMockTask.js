import { runSaga } from '@redux-saga/core'
import { fork, cancel, join } from 'redux-saga/effects'
import { createMockTask } from '../src'

test('can be cancelled', () => {
  function* sagaToRun() {}

  function* rootSaga() {
    const task = yield fork(sagaToRun)
    yield cancel(task)
  }

  const taskMock = createMockTask()
  const generator = rootSaga()
  expect(generator.next().value).toEqual(fork(sagaToRun))
  expect(generator.next(taskMock).value).toEqual(cancel(taskMock))
})

test('can be joined', () => {
  function* sagaToRun() {}

  function* rootSaga() {
    const task = yield fork(sagaToRun)
    yield join(task)
  }

  const taskMock = createMockTask()
  const generator = rootSaga()
  expect(generator.next().value).toEqual(fork(sagaToRun))
  expect(generator.next(taskMock).value).toEqual(join(taskMock))
})

test('returns a value from being joined when result is set', done => {
  runSaga({}, function* saga() {
    const task = createMockTask()
    task.setResult(42)
    const result = yield join(task)
    expect(result).toBe(42)
    done()
  })
})

test('throws an error from being joined when an error is set', done => {
  runSaga({}, function* saga() {
    const task = createMockTask()
    const givenErr = new Error('something wrong')
    task.setError(givenErr)
    try {
      yield join(task)
    } catch (err) {
      expect(err).toBe(givenErr)
      done()
    }
  })
})

test('is running when created', () => {
  const taskMock = createMockTask()
  expect(taskMock.isRunning()).toBe(true)
  expect(taskMock.result()).toBe(undefined)
  expect(taskMock.error()).toBe(undefined)
})

test('is not running after setting the result', () => {
  const taskMock = createMockTask()
  taskMock.setResult(42)
  expect(taskMock.isRunning()).toBe(false)
  expect(taskMock.isAborted()).toBe(false)
  expect(taskMock.isCancelled()).toBe(false)
  expect(taskMock.result()).toBe(42)
})

test('is not running after setting an error', () => {
  const taskMock = createMockTask()
  const err = new Error('Oh no')
  taskMock.setError(err)
  expect(taskMock.isRunning()).toBe(false)
  expect(taskMock.isAborted()).toBe(true)
  expect(taskMock.isCancelled()).toBe(false)
  expect(taskMock.error()).toBe(err)
})

test('is not running after cancelling', () => {
  const taskMock = createMockTask()
  taskMock.cancel()
  expect(taskMock.isRunning()).toBe(false)
  expect(taskMock.isAborted()).toBe(false)
  expect(taskMock.isCancelled()).toBe(true)
})

test('throws an error when making invalid state transitions', () => {
  const cancelledTask = createMockTask()
  cancelledTask.cancel()
  const cancelledError = /The task is no longer Running, it is Cancelled/
  expect(() => cancelledTask.setResult(42)).toThrowError(cancelledError)
  expect(() => cancelledTask.setError()).toThrowError(cancelledError)
  expect(() => cancelledTask.cancel()).toThrowError(cancelledError)

  const abortedTask = createMockTask()
  abortedTask.setError(new Error('Bad things'))
  const abortedErrorPattern = /The task is no longer Running, it is Aborted/
  expect(() => abortedTask.setResult(42)).toThrowError(abortedErrorPattern)
  expect(() => abortedTask.setError()).toThrowError(abortedErrorPattern)
  expect(() => abortedTask.cancel()).toThrowError(abortedErrorPattern)

  const completedTask = createMockTask()
  completedTask.setResult(42)
  const completedErrorPattern = /The task is no longer Running, it is Done/
  expect(() => completedTask.setResult(42)).toThrowError(completedErrorPattern)
  expect(() => completedTask.setError()).toThrowError(completedErrorPattern)
  expect(() => completedTask.cancel()).toThrowError(completedErrorPattern)
})
