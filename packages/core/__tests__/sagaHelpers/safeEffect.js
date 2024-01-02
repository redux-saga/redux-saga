import createSafeEffect, {
  loadingStartedActionType,
  loadingCompleteActionType,
  errorActionType,
} from '../../src/internal/sagaHelpers/createSafeEffect'
import sagaMiddleware from '../../src'
import { applyMiddleware, createStore } from 'redux'
import takeSafe from '../../src/internal/sagaHelpers/takeSafe'

// not implemented yet
const sagaMiddlewareSafe = sagaMiddleware

const testActionType = 'TEST_ACTION'
const testErrorMessage = 'test error'

const testActionCreator = () => ({
  type: testActionType,
  payload: 'test',
})

testActionCreator.type = testActionType

const makeTestStore = (root, safeEffect) => {
  const actualActionsThatGotDispatched = []
  const rootReducer = (state, action) => {
    actualActionsThatGotDispatched.push(action)
    return state
  }
  const middleware = sagaMiddlewareSafe(safeEffect)
  const store = applyMiddleware(middleware)(createStore)(rootReducer)
  middleware.run(root)

  store.getActionHistory = () => actualActionsThatGotDispatched

  return store
}

test('safeEffect yields loading actions to a store on success', () => {
  function* root() {
    yield takeSafe(testActionCreator.type, worker)
  }

  let workerCalledTimes = 0

  function* worker() {
    workerCalledTimes++
  }

  const store = makeTestStore(root)

  store.dispatch(testActionCreator())
  const [, loadingStartsAction, actualAction, loadingEndedAction] = store.getActionHistory()

  expect(loadingStartsAction.type).toEqual(loadingStartedActionType)
  expect(loadingStartsAction.payload).toEqual(testActionCreator.type)

  expect(actualAction.type).toEqual(testActionCreator.type)
  expect(actualAction.payload).toEqual(testActionCreator.payload)

  expect(loadingEndedAction.type).toEqual(loadingCompleteActionType)
  expect(loadingEndedAction.payload).toEqual(testActionCreator.type)

  expect(workerCalledTimes).toEqual(1)
})

test('safeEffect yields loading and error actions to a store on error', () => {
  function* root() {
    yield takeSafe(testActionCreator.type, worker)
  }

  let workerCalledTimes = 0

  function* worker() {
    workerCalledTimes++
    throw new Error(testErrorMessage)
  }

  // middleware with the default safe effect wrapper
  const store = makeTestStore(root)

  store.dispatch(testActionCreator())
  const [, loadingStartsAction, actualAction, errorAction, loadingEndedAction] = store.getActionHistory()

  expect(loadingStartsAction.type).toEqual(loadingStartedActionType)
  expect(loadingStartsAction.payload).toEqual(testActionCreator.type)

  expect(actualAction.type).toEqual(testActionCreator.type)
  expect(actualAction.payload).toEqual(testActionCreator.payload)

  expect(errorAction.type).toEqual(errorActionType)
  expect(errorAction.payload.message).toEqual(testErrorMessage)
  expect(errorAction.actionType).toEqual(testActionCreator.type)

  expect(loadingEndedAction.type).toEqual(loadingCompleteActionType)
  expect(loadingEndedAction.payload).toEqual(testActionCreator.type)

  expect(workerCalledTimes).toEqual(1)
})

test('safeEffect implements template method, so it can be enhanced with custom behavior on success', () => {
  let successIsCalled = false
  const successHandeler = function* () {
    successIsCalled = true
  }

  let workerCalledTimes = 0

  function* root() {
    yield takeSafe(testActionCreator.type, worker)
  }

  function* worker() {
    workerCalledTimes++
  }

  const safeEffect = createSafeEffect(undefined, successHandeler)
  const store = makeTestStore(root, safeEffect)

  store.dispatch(testActionCreator())

  expect(successIsCalled).toEqual(true)
  expect(workerCalledTimes).toEqual(1)
})

test('safeEffect implements template method, so it can be enhanced with custom behavior on failure', () => {
  let errorIsCalled = false
  let errorMessageRecieved = ''

  const errorHandeler = function* (action) {
    errorIsCalled = true
    errorMessageRecieved = action.payload.message
  }

  let workerCalledTimes = 0

  function* root() {
    yield takeSafe(testActionCreator.type, worker)
  }

  function* worker() {
    workerCalledTimes++
    throw new Error(testErrorMessage)
  }

  const safeEffect = createSafeEffect(undefined, errorHandeler)
  const store = makeTestStore(root, safeEffect)

  store.dispatch(testActionCreator())

  expect(errorIsCalled).toEqual(true)
  expect(workerCalledTimes).toEqual(1)
  expect(errorMessageRecieved).toEqual(testErrorMessage)
})
