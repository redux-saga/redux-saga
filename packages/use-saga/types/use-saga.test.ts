import { Task } from 'redux-saga'
import { take } from 'redux-saga/effects'
import {
  RunSaga,
  StateUpdated,
  useSaga,
  waitUntil,
  waitUntilChanged,
  waitUntilExists,
  waitUntilTrue,
} from '@redux-saga/use-saga'

type State = { text: string; list: number[]; ready: boolean; user?: { name: string } }
type Action = { type: 'proceed' } | { type: 'change'; payload: string }

declare const state: State
declare const reducerDispatch: (action: Action) => void

const stateUpdated: '@@STATE_UPDATED' = StateUpdated

function testUseSaga() {
  function* saga() {
    yield take('proceed')
  }

  const { dispatch, runSaga } = useSaga({ state, dispatch: reducerDispatch }, saga)

  dispatch({ type: 'proceed' })
  dispatch({ type: 'change', payload: 'text' })
  // @ts-expect-error
  dispatch({ type: 'unknown' })
  // @ts-expect-error
  dispatch({ type: 'change', payload: 1 })

  const run: RunSaga = runSaga

  useSaga(
    { state, dispatch: reducerDispatch, onError: (error: Error, { sagaStack }: { sagaStack: string }) => {} },
    saga,
  )
  // @ts-expect-error
  useSaga({ state, dispatch: reducerDispatch, onError: (error: string) => {} }, saga)
  // @ts-expect-error
  useSaga({ state }, saga)
}

function testUseSagaArgs() {
  function* sagaWithArgs(fn: (str: string) => void, count: number) {
    yield take('proceed')
  }

  useSaga({ state, dispatch: reducerDispatch }, sagaWithArgs, (str: string) => {}, 1)
  // @ts-expect-error
  useSaga({ state, dispatch: reducerDispatch }, sagaWithArgs)
  // @ts-expect-error
  useSaga({ state, dispatch: reducerDispatch }, sagaWithArgs, (str: string) => {}, '1')
  // @ts-expect-error
  useSaga({ state, dispatch: reducerDispatch }, sagaWithArgs, (str: string) => {}, 1, 'extra')
}

function testRunSaga(runSaga: RunSaga) {
  function* nestedSaga(id: number) {
    yield take('proceed')
  }

  const task: Task = runSaga({}, nestedSaga, 1)
  runSaga({ onError: () => {} }, nestedSaga, 1)
  // @ts-expect-error
  runSaga({}, nestedSaga)
  // @ts-expect-error
  runSaga({}, nestedSaga, '1')
}

function* testWaitUntil() {
  const changed: [string, string] = yield* waitUntilChanged((s: State) => s.text)
  const changedList: [number[], number[]] = yield* waitUntilChanged((s: State) => s.list)
  const changedById: [number, number] = yield* waitUntilChanged((s: State, index: number) => s.list[index], 0)
  // @ts-expect-error
  yield* waitUntilChanged((s: State, index: number) => s.list[index], '0')

  const text: string = yield* waitUntil(
    (value) => value.length > 0,
    (s: State) => s.text,
  )
  yield* waitUntil(
    // @ts-expect-error
    (value: number) => value > 0,
    (s: State) => s.text,
  )

  const user: { name: string } = yield* waitUntilExists((s: State) => s.user)
  const ready: true = yield* waitUntilTrue((s: State) => s.ready)
  // @ts-expect-error
  yield* waitUntilTrue((s: State) => s.text)
}
