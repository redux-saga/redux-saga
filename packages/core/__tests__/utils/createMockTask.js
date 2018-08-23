import { createMockTask } from '../../src/utils'
import { fork, cancel } from '../../src/effects'
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
