import { fork, cancel } from 'redux-saga/effects'
import { createMockTask } from '../src'

test('should allow to use createMockTask for testing purposes', () => {
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
