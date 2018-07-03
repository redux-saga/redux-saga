import test from 'tape'
import { createMockTask } from '../../src/utils'
import { fork, cancel } from '../../src/effects'

test('should allow to use createMockTask for testing purposes', assert => {
  function* sagaToRun() {}
  function* rootSaga() {
    const task = yield fork(sagaToRun)
    yield cancel(task)
  }

  const taskMock = createMockTask()

  const generator = rootSaga()
  assert.deepEqual(generator.next().value, fork(sagaToRun))
  assert.deepEqual(generator.next(taskMock).value, cancel(taskMock))

  assert.end()
})
