import { SagaIterator, Channel, EventChannel, MulticastChannel, Task, Buffer, END, buffers, detach } from 'redux-saga'
import {
  take,
  takeMaybe,
  put,
  putResolve,
  call,
  apply,
  cps,
  fork,
  spawn,
  join,
  cancel,
  select,
  actionChannel,
  cancelled,
  flush,
  setContext,
  getContext,
  takeEvery,
  takeLatest,
  takeLeading,
  throttle,
  delay,
  retry,
  all,
  race,
  debounce,
} from 'redux-saga/effects'
import { Action, ActionCreator } from 'redux'
import { StringableActionCreator, ActionMatchingPattern } from '@redux-saga/types'

interface MyAction extends Action {
  customField: string
}

declare const stringableActionCreator: ActionCreator<MyAction>

Object.assign(stringableActionCreator, {
  toString() {
    return 'my-action'
  },
})

const isMyAction = (action: Action): action is MyAction => {
  return action.type === 'my-action'
}

type ChannelItem = { someField: string }
declare const channel: Channel<ChannelItem>
declare const eventChannel: EventChannel<ChannelItem>
declare const multicastChannel: MulticastChannel<ChannelItem>

function* testTake(): SagaIterator {
  yield take()
  yield take('my-action')
  yield take((action: Action) => action.type === 'my-action')
  yield take(isMyAction)

  // typings:expect-error
  yield take(() => {})

  yield take(stringableActionCreator)

  yield take(['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction])

  // typings:expect-error
  yield take([() => {}])

  yield takeMaybe(['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction])

  yield take(channel)
  yield takeMaybe(channel)

  yield take(eventChannel)
  yield takeMaybe(eventChannel)

  yield take(multicastChannel)
  yield takeMaybe(multicastChannel)

  // typings:expect-error
  yield take(multicastChannel, (input: { someField: number }) => input.someField === 'foo')
  yield take(multicastChannel, (input: ChannelItem) => input.someField === 'foo')

  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield take([pattern1, pattern2])
  yield takeMaybe([pattern1, pattern2])
}

function* testPut(): SagaIterator {
  yield put({ type: 'my-action' })

  // typings:expect-error
  yield put(channel, { type: 'my-action' })

  yield put(channel, { someField: '--' })
  yield put(channel, END)

  // typings:expect-error
  yield put(eventChannel, { someField: '--' })
  // typings:expect-error
  yield put(eventChannel, END)

  yield put(multicastChannel, { someField: '--' })
  yield put(multicastChannel, END)

  yield putResolve({ type: 'my-action' })
}

function* testCall(): SagaIterator {
  // typings:expect-error
  yield call()

  // typings:expect-error
  yield call({})

  yield call(() => {})

  // typings:expect-error
  yield call((a: 'a') => {})

  // TODO: https://github.com/Microsoft/TypeScript/issues/28803
  {
    // typings:expect-error
    // yield call(function*(a: 'a'): SagaIterator {})
  }

  // typings:expect-error
  yield call((a: 'a') => {}, 1)
  // typings:expect-error
  yield call(function*(a: 'a'): SagaIterator {}, 1)
  yield call((a: 'a') => {}, 'a')
  yield call(function*(a: 'a'): SagaIterator {}, 'a')

  yield call<(a: 'a') => number>((a: 'a') => 1, 'a')

  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 'a')
  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 'a', 1)
  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 1, 'b')
  yield call((a: 'a', b: 'b') => {}, 'a', 'b')

  // typings:expect-error
  yield call((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 1, 'b', 'c', 'd', 'e', 'f', 'g')

  yield call((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield call<(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => number>(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => 1,
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
  )

  const obj = {
    foo: 'bar',
    getFoo(arg: 'bar') {
      return this.foo
    },
  }

  // typings:expect-error
  yield call([obj, obj.foo])
  // typings:expect-error
  yield call([obj, obj.getFoo])
  yield call([obj, obj.getFoo], 'bar')
  // typings:expect-error
  yield call([obj, obj.getFoo], 1)

  // typings:expect-error
  yield call([obj, 'foo'])
  // typings:expect-error
  yield call([obj, 'getFoo'])
  // typings:expect-error
  yield call([obj, 'getFoo'], 1)
  yield call([obj, 'getFoo'], 'bar')
  yield call<typeof obj, 'getFoo'>([obj, 'getFoo'], 'bar')

  // typings:expect-error
  yield call({ context: obj, fn: obj.foo })
  // typings:expect-error
  yield call({ context: obj, fn: obj.getFoo })
  yield call({ context: obj, fn: obj.getFoo }, 'bar')
  // typings:expect-error
  yield call({ context: obj, fn: obj.getFoo }, 1)

  // typings:expect-error
  yield call({ context: obj, fn: 'foo' })
  // typings:expect-error
  yield call({ context: obj, fn: 'getFoo' })
  // typings:expect-error
  yield call({ context: obj, fn: 'getFoo' }, 1)
  yield call({ context: obj, fn: 'getFoo' }, 'bar')
  yield call<typeof obj, 'getFoo'>({ context: obj, fn: 'getFoo' }, 'bar')
}

function* testApply(): SagaIterator {
  const obj = {
    foo: 'bar',
    getFoo() {
      return this.foo
    },
    meth1(a: string) {
      return 1
    },
    meth2(a: string, b: number) {
      return 1
    },
    meth7(a: string, b: number, c: string, d: number, e: string, f: number, g: string) {
      return 1
    },
  }

  // typings:expect-error
  yield apply(obj, obj.foo, [])
  yield apply(obj, obj.getFoo, [])
  yield apply<typeof obj, () => string>(obj, obj.getFoo, [])

  // typings:expect-error
  yield apply(obj, 'foo', [])
  yield apply(obj, 'getFoo', [])
  yield apply<typeof obj, 'getFoo'>(obj, 'getFoo', [])

  // typings:expect-error
  yield apply(obj, obj.meth1)
  // typings:expect-error
  yield apply(obj, obj.meth1, [])
  // typings:expect-error
  yield apply(obj, obj.meth1, [1])
  yield apply(obj, obj.meth1, ['a'])
  yield apply<typeof obj, (a: string) => number>(obj, obj.meth1, ['a'])

  // typings:expect-error
  yield apply(obj, 'meth1')
  // typings:expect-error
  yield apply(obj, 'meth1', [])
  // typings:expect-error
  yield apply(obj, 'meth1', [1])
  yield apply(obj, 'meth1', ['a'])
  yield apply<typeof obj, 'meth1'>(obj, 'meth1', ['a'])

  // typings:expect-error
  yield apply(obj, obj.meth2, ['a'])
  // typings:expect-error
  yield apply(obj, obj.meth2, ['a', 'b'])
  // typings:expect-error
  yield apply(obj, obj.meth2, [1, 'b'])
  yield apply(obj, obj.meth2, ['a', 1])
  yield apply<typeof obj, (a: string, b: number) => number>(obj, obj.meth2, ['a', 1])

  // typings:expect-error
  yield apply(obj, 'meth2', ['a'])
  // typings:expect-error
  yield apply(obj, 'meth2', ['a', 'b'])
  // typings:expect-error
  yield apply(obj, 'meth2', [1, 'b'])
  yield apply(obj, 'meth2', ['a', 1])
  yield apply<typeof obj, 'meth2'>(obj, 'meth2', ['a', 1])

  // typings:expect-error
  yield apply(obj, obj.meth7, [1, 'b', 'c', 'd', 'e', 'f', 'g'])
  yield apply(obj, obj.meth7, ['a', 1, 'b', 2, 'c', 3, 'd'])
  yield apply<typeof obj, (a: string, b: number, c: string, d: number, e: string, f: number, g: string) => number>(
    obj,
    obj.meth7,
    ['a', 1, 'b', 2, 'c', 3, 'd'],
  )

  // typings:expect-error
  yield apply(obj, 'meth7', [1, 'b', 'c', 'd', 'e', 'f', 'g'])
  yield apply(obj, 'meth7', ['a', 1, 'b', 2, 'c', 3, 'd'])
  yield apply<typeof obj, 'meth7'>(obj, 'meth7', ['a', 1, 'b', 2, 'c', 3, 'd'])
}

function* testCps(): SagaIterator {
  type Cb<R> = (error: any, result: R) => void

  // typings:expect-error
  yield cps((a: number) => {})

  yield cps(cb => {
    cb(null, 1)
  })
  yield cps((cb: Cb<number>) => {
    cb(null, 1)
  })

  // typings:expect-error
  yield cps<(cb: Cb<string>) => void>(cb => {
    cb(null, 1)
  })
  yield cps<(cb: Cb<number>) => void>(cb => {
    cb(null, 1)
  })

  yield cps(cb => {
    cb.cancel = () => {}
  })

  // typings:expect-error
  yield cps((a: 'a', cb: Cb<number>) => {})
  // typings:expect-error
  yield cps((a: 'a', cb: Cb<number>) => {}, 1)
  yield cps((a: 'a', cb: Cb<number>) => {}, 'a')

  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb) => {}, 'a')
  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb) => {}, 'a', 1)
  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb: Cb<number>) => {}, 1, 'b')
  yield cps((a: 'a', b: 'b', cb: Cb<number>) => {}, 'a', 'b')

  // typings:expect-error
  yield cps((a: 'a', b: 'b', c: 'c', d: 'd', cb: Cb<number>) => {}, 1, 'b', 'c', 'd')

  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', cb: Cb<number>) => {
      cb(null, 1)
    },
    'a',
    'b',
    'c',
    'd',
  )
  yield cps<(a: 'a', b: 'b', c: 'c', d: 'd', cb: Cb<number>) => void>(
    (a: 'a', b: 'b', c: 'c', d: 'd', cb: Cb<number>) => {
      cb(null, 1)
    },
    'a',
    'b',
    'c',
    'd',
  )

  // typings:expect-error
  yield cps((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb: Cb<number>) => {}, 1, 'b', 'c', 'd', 'e', 'f')

  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb: Cb<number>) => {
      cb(null, 1)
    },
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  )
  yield cps<(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb: Cb<number>) => void>(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb: Cb<number>) => {
      cb(null, 1)
    },
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  )

  const obj = {
    foo: 'bar',
    getFoo(arg: string, cb: Cb<string>) {
      cb(null, this.foo)
    },
  }

  // typings:expect-error
  yield cps([obj, obj.foo])
  // typings:expect-error
  yield cps([obj, obj.getFoo])
  // typings:expect-error
  yield cps([obj, obj.getFoo], 1)
  yield cps([obj, obj.getFoo], 'bar')
  yield cps<typeof obj, (arg: string, cb: Cb<string>) => void>([obj, obj.getFoo], 'bar')

  // typings:expect-error
  yield cps([obj, 'foo'])
  // typings:expect-error
  yield cps([obj, 'getFoo'])
  // typings:expect-error
  yield cps([obj, 'getFoo'], 1)
  yield cps([obj, 'getFoo'], 'bar')
  yield cps<typeof obj, 'getFoo'>([obj, 'getFoo'], 'bar')

  // typings:expect-error
  yield cps({ context: obj, fn: obj.foo })
  // typings:expect-error
  yield cps({ context: obj, fn: obj.getFoo })
  // typings:expect-error
  yield cps({ context: obj, fn: obj.getFoo }, 1)
  yield cps<typeof obj, (arg: string, cb: Cb<string>) => void>({ context: obj, fn: obj.getFoo }, 'bar')

  // typings:expect-error
  yield cps({ context: obj, fn: 'foo' })
  // typings:expect-error
  yield cps({ context: obj, fn: 'getFoo' })
  // typings:expect-error
  yield cps({ context: obj, fn: 'getFoo' }, 1)
  yield cps({ context: obj, fn: 'getFoo' }, 'bar')
  yield cps<typeof obj, 'getFoo'>({ context: obj, fn: 'getFoo' }, 'bar')
}

function* testFork(): SagaIterator {
  // typings:expect-error
  yield fork()

  yield fork(() => {})

  // typings:expect-error
  yield fork((a: 'a') => {})
  // typings:expect-error
  yield fork((a: 'a') => {}, 1)
  yield fork((a: 'a') => {}, 'a')

  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 'a')
  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 'a', 1)
  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 1, 'b')
  yield fork((a: 'a', b: 'b') => {}, 'a', 'b')

  // typings:expect-error
  yield fork((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 1, 'b', 'c', 'd', 'e', 'f', 'g')

  yield fork((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  const obj = {
    foo: 'bar',
    getFoo(arg: string) {
      return this.foo
    },
  }

  // typings:expect-error
  yield fork([obj, obj.foo])
  // typings:expect-error
  yield fork([obj, obj.getFoo])
  yield fork([obj, obj.getFoo], 'bar')
  // typings:expect-error
  yield fork([obj, obj.getFoo], 1)

  // typings:expect-error
  yield fork([obj, 'foo'])
  // typings:expect-error
  yield fork([obj, 'getFoo'])
  yield fork([obj, 'getFoo'], 'bar')
  // typings:expect-error
  yield fork([obj, 'getFoo'], 1)

  // typings:expect-error
  yield fork({ context: obj, fn: obj.foo })
  // typings:expect-error
  yield fork({ context: obj, fn: obj.getFoo })
  yield fork({ context: obj, fn: obj.getFoo }, 'bar')
  // typings:expect-error
  yield fork({ context: obj, fn: obj.getFoo }, 1)

  // typings:expect-error
  yield fork({ context: obj, fn: 'foo' })
  // typings:expect-error
  yield fork({ context: obj, fn: 'getFoo' })
  yield fork({ context: obj, fn: 'getFoo' }, 'bar')
  // typings:expect-error
  yield fork({ context: obj, fn: 'getFoo' }, 1)
}

function* testSpawn(): SagaIterator {
  // typings:expect-error
  yield spawn()

  yield spawn(() => {})

  // typings:expect-error
  yield spawn((a: 'a') => {})
  // typings:expect-error
  yield spawn((a: 'a') => {}, 1)
  yield spawn((a: 'a') => {}, 'a')

  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 'a')
  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 'a', 1)
  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 1, 'b')
  yield spawn((a: 'a', b: 'b') => {}, 'a', 'b')

  // typings:expect-error
  yield spawn((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 1, 'b', 'c', 'd', 'e', 'f', 'g')

  yield spawn((a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  const obj = {
    foo: 'bar',
    getFoo(arg: string) {
      return this.foo
    },
  }

  // typings:expect-error
  yield spawn([obj, obj.foo])
  // typings:expect-error
  yield spawn([obj, obj.getFoo])
  yield spawn([obj, obj.getFoo], 'bar')
  // typings:expect-error
  yield spawn([obj, obj.getFoo], 1)

  // typings:expect-error
  yield spawn([obj, 'foo'])
  // typings:expect-error
  yield spawn([obj, 'getFoo'])
  yield spawn([obj, 'getFoo'], 'bar')
  // typings:expect-error
  yield spawn([obj, 'getFoo'], 1)

  // typings:expect-error
  yield spawn({ context: obj, fn: obj.foo })
  // typings:expect-error
  yield spawn({ context: obj, fn: obj.getFoo })
  yield spawn({ context: obj, fn: obj.getFoo }, 'bar')
  // typings:expect-error
  yield spawn({ context: obj, fn: obj.getFoo }, 1)

  // typings:expect-error
  yield spawn({ context: obj, fn: 'foo' })
  // typings:expect-error
  yield spawn({ context: obj, fn: 'getFoo' })
  yield spawn({ context: obj, fn: 'getFoo' }, 'bar')
  // typings:expect-error
  yield spawn({ context: obj, fn: 'getFoo' }, 1)
}

declare const task: Task

function* testJoin(): SagaIterator {
  // typings:expect-error
  yield join()

  // typings:expect-error
  yield join({})

  yield join(task)
  // typings:expect-error
  yield join(task, task)
  yield join([task, task])
  yield join([task, task, task])

  // typings:expect-error
  yield join([task, task, {}])
}

function* testCancel(): SagaIterator {
  yield cancel()

  // typings:expect-error
  yield cancel(undefined)
  // typings:expect-error
  yield cancel({})

  yield cancel(task)
  // typings:expect-error
  yield cancel(task, task)
  yield cancel([task, task])
  yield cancel([task, task, task])

  const tasks: Task[] = []

  yield cancel(tasks)

  // typings:expect-error
  yield cancel([task, task, {}])
}

function* testDetach(): SagaIterator {
  yield detach(fork(() => {}))

  // typings:expect-error
  yield detach(call(() => {}))
}

function* testSelect(): SagaIterator {
  type State = { foo: string }

  yield select()

  yield select((state: State) => state.foo)
  // typings:expect-error
  yield select<(state: State) => number>((state: State) => state.foo)
  yield select<(state: State) => string>((state: State) => state.foo)

  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo)
  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo, 1)
  yield select((state: State, a: 'a') => state.foo, 'a')
  yield select<(state: State, a: 'a') => string>((state: State, a: 'a') => state.foo, 'a')

  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a')
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 1)
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 1, 'b')
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 'b')
  yield select<(state: State, a: 'a', b: 'b') => string>((state: State, a: 'a', b: 'b') => state.foo, 'a', 'b')

  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo, 1, 'b', 'c', 'd', 'e', 'f')

  yield select(
    (state: State, a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  )
  yield select<(state: State, a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => string>(
    (state: State, a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  )
}

declare const actionBuffer: Buffer<Action>
declare const nonActionBuffer: Buffer<ChannelItem>

function* testActionChannel(): SagaIterator {
  // typings:expect-error
  yield actionChannel()

  /* action type */

  yield actionChannel('my-action')
  yield actionChannel('my-action', actionBuffer)
  // typings:expect-error
  yield actionChannel('my-action', nonActionBuffer)

  /* action predicate */

  yield actionChannel((action: Action) => action.type === 'my-action')
  yield actionChannel((action: Action) => action.type === 'my-action', actionBuffer)
  // typings:expect-error
  yield actionChannel((action: Action) => action.type === 'my-action', nonActionBuffer)
  // typings:expect-error
  yield actionChannel((item: ChannelItem) => item.someField === '--', actionBuffer)

  // typings:expect-error
  yield actionChannel(() => {})
  // typings:expect-error
  yield actionChannel(() => {}, actionBuffer)

  /* stringable action creator */

  yield actionChannel(stringableActionCreator)

  yield actionChannel(stringableActionCreator, buffers.fixed<MyAction>())
  // typings:expect-error
  yield actionChannel(stringableActionCreator, nonActionBuffer)

  /* array */

  yield actionChannel(['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator])

  // typings:expect-error
  yield actionChannel([() => {}])
}

function* testCancelled(): SagaIterator {
  yield cancelled()
  // typings:expect-error
  yield cancelled(1)
}

function* testFlush(): SagaIterator {
  // typings:expect-error
  yield flush()
  // typings:expect-error
  yield flush({})

  yield flush(channel)
  yield flush(eventChannel)
  // typings:expect-error
  yield flush(multicastChannel)
}

function* testGetContext(): SagaIterator {
  // typings:expect-error
  yield getContext()

  // typings:expect-error
  yield getContext({})

  yield getContext('prop')
}

function* testSetContext(): SagaIterator {
  // typings:expect-error
  yield setContext()

  // typings:expect-error
  yield setContext('prop')

  yield setContext({ prop: 1 })
}

function* testTakeEvery(): SagaIterator {
  // typings:expect-error
  yield takeEvery()
  // typings:expect-error
  yield takeEvery('my-action')

  yield takeEvery('my-action', (action: Action) => {})
  yield takeEvery('my-action', (action: MyAction) => {})
  yield takeEvery('my-action', function*(action: Action): SagaIterator {})
  yield takeEvery('my-action', function*(action: MyAction): SagaIterator {})

  const helperWorker1 = (a: 'a', action: MyAction) => {}

  // typings:expect-error
  yield takeEvery('my-action', helperWorker1)
  // typings:expect-error
  yield takeEvery('my-action', helperWorker1, 1)
  yield takeEvery('my-action', helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeEvery('my-action', helperSaga1)
  // typings:expect-error
  yield takeEvery('my-action', helperSaga1, 1)
  yield takeEvery('my-action', helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction) => {}

  // typings:expect-error
  yield takeEvery('my-action', helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeEvery('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeEvery('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  const helperWorker8 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {}

  // typings:expect-error
  yield takeEvery('my-action', helperWorker8, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeEvery('my-action', helperWorker8, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeEvery('my-action', helperWorker8, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeEvery('my-action', helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeEvery('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeEvery('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeEvery((action: Action) => action.type === 'my-action', (action: Action) => {})
  yield takeEvery(isMyAction, action => action.customField)

  yield takeEvery(
    isMyAction,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  // typings:expect-error
  yield takeEvery(() => {}, (action: Action) => {})

  yield takeEvery(stringableActionCreator, action => action.customField)

  yield takeEvery(
    stringableActionCreator,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  yield takeEvery(
    ['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction],
    (action: Action) => {},
  )

  // test inference of action types from action pattern
  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield takeEvery([pattern1, pattern2], action => {
    if (action.type === 'A') {
    }

    if (action.type === 'B') {
    }

    // typings:expect-error
    if (action.type === 'C') {
    }
  })
  yield takeEvery(
    [pattern1, pattern2],
    (arg: { foo: string }, action: ActionMatchingPattern<typeof pattern1 | typeof pattern2>) => {
      if (action.type === 'A') {
      }

      if (action.type === 'B') {
      }

      // typings:expect-error
      if (action.type === 'C') {
      }
    },
    { foo: 'bar' },
  )
}

function* testChannelTakeEvery(): SagaIterator {
  // typings:expect-error
  yield takeEvery(channel)

  // typings:expect-error
  yield takeEvery(channel, (action: Action) => {})
  yield takeEvery(channel, (action: ChannelItem) => {})
  yield takeEvery(channel, action => {
    // typings:expect-error
    action.foo
    action.someField
  })

  const helperWorker1 = (a: 'a', action: ChannelItem) => {}

  // typings:expect-error
  yield takeEvery(channel, helperWorker1)
  // typings:expect-error
  yield takeEvery(channel, helperWorker1, 1)
  yield takeEvery(channel, helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeEvery(channel, helperSaga1)
  // typings:expect-error
  yield takeEvery(channel, helperSaga1, 1)
  yield takeEvery(channel, helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem) => {}

  // typings:expect-error
  yield takeEvery(channel, helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeEvery(channel, helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeEvery(channel, helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeEvery(channel, helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeEvery(eventChannel, (action: ChannelItem) => {})
  yield takeEvery(multicastChannel, (action: ChannelItem) => {})
}

function* testTakeLatest(): SagaIterator {
  // typings:expect-error
  yield takeLatest()
  // typings:expect-error
  yield takeLatest('my-action')

  yield takeLatest('my-action', (action: Action) => {})
  yield takeLatest('my-action', (action: MyAction) => {})
  yield takeLatest('my-action', function*(action: Action): SagaIterator {})
  yield takeLatest('my-action', function*(action: MyAction): SagaIterator {})

  const helperWorker1 = (a: 'a', action: MyAction) => {}

  // typings:expect-error
  yield takeLatest('my-action', helperWorker1)
  // typings:expect-error
  yield takeLatest('my-action', helperWorker1, 1)
  yield takeLatest('my-action', helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeLatest('my-action', helperSaga1)
  // typings:expect-error
  yield takeLatest('my-action', helperSaga1, 1)
  yield takeLatest('my-action', helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction) => {}

  // typings:expect-error
  yield takeLatest('my-action', helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeLatest('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeLatest('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeLatest('my-action', helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeLatest('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeLatest('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeLatest((action: Action) => action.type === 'my-action', (action: Action) => {})
  yield takeLatest(isMyAction, action => action.customField)

  yield takeLatest(
    isMyAction,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  // typings:expect-error
  yield takeLatest(() => {}, (action: Action) => {})

  yield takeLatest(stringableActionCreator, action => action.customField)

  yield takeLatest(
    stringableActionCreator,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  yield takeLatest(
    ['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction],
    (action: Action) => {},
  )

  // test inference of action types from action pattern
  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield takeLatest([pattern1, pattern2], action => {
    if (action.type === 'A') {
    }

    if (action.type === 'B') {
    }

    // typings:expect-error
    if (action.type === 'C') {
    }
  })
  yield takeLatest(
    [pattern1, pattern2],
    (arg: { foo: string }, action: ActionMatchingPattern<typeof pattern1 | typeof pattern2>) => {
      if (action.type === 'A') {
      }

      if (action.type === 'B') {
      }

      // typings:expect-error
      if (action.type === 'C') {
      }
    },
    { foo: 'bar' },
  )
}

function* testChannelTakeLatest(): SagaIterator {
  // typings:expect-error
  yield takeLatest(channel)

  // typings:expect-error
  yield takeLatest(channel, (action: Action) => {})
  yield takeLatest(channel, (action: ChannelItem) => {})
  yield takeLatest(channel, action => {
    // typings:expect-error
    action.foo
    action.someField
  })

  const helperWorker1 = (a: 'a', action: ChannelItem) => {}

  // typings:expect-error
  yield takeLatest(channel, helperWorker1)
  // typings:expect-error
  yield takeLatest(channel, helperWorker1, 1)
  yield takeLatest(channel, helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeLatest(channel, helperSaga1)
  // typings:expect-error
  yield takeLatest(channel, helperSaga1, 1)
  yield takeLatest(channel, helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem) => {}

  // typings:expect-error
  yield takeLatest(channel, helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeLatest(channel, helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeLatest(channel, helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeLatest(channel, helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeLatest(eventChannel, (action: ChannelItem) => {})
  yield takeLatest(multicastChannel, (action: ChannelItem) => {})
}

function* testTakeLeading(): SagaIterator {
  // typings:expect-error
  yield takeLeading()
  // typings:expect-error
  yield takeLeading('my-action')

  yield takeLeading('my-action', (action: Action) => {})
  yield takeLeading('my-action', (action: MyAction) => {})
  yield takeLeading('my-action', function*(action: Action): SagaIterator {})
  yield takeLeading('my-action', function*(action: MyAction): SagaIterator {})

  const helperWorker1 = (a: 'a', action: MyAction) => {}

  // typings:expect-error
  yield takeLeading('my-action', helperWorker1)
  // typings:expect-error
  yield takeLeading('my-action', helperWorker1, 1)
  yield takeLeading('my-action', helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeLeading('my-action', helperSaga1)
  // typings:expect-error
  yield takeLeading('my-action', helperSaga1, 1)
  yield takeLeading('my-action', helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction) => {}

  // typings:expect-error
  yield takeLeading('my-action', helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeLeading('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeLeading('my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield takeLeading('my-action', helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield takeLeading('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield takeLeading('my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeLeading((action: Action) => action.type === 'my-action', (action: Action) => {})
  yield takeLeading(isMyAction, action => action.customField)

  yield takeLeading(
    isMyAction,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  // typings:expect-error
  yield takeLeading(() => {}, (action: Action) => {})

  yield takeLeading(stringableActionCreator, action => action.customField)

  yield takeLeading(
    stringableActionCreator,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  yield takeLeading(
    ['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction],
    (action: Action) => {},
  )

  // test inference of action types from action pattern
  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield takeLeading([pattern1, pattern2], action => {
    if (action.type === 'A') {
    }

    if (action.type === 'B') {
    }

    // typings:expect-error
    if (action.type === 'C') {
    }
  })
  yield takeLeading(
    [pattern1, pattern2],
    (arg: { foo: string }, action: ActionMatchingPattern<typeof pattern1 | typeof pattern2>) => {
      if (action.type === 'A') {
      }

      if (action.type === 'B') {
      }

      // typings:expect-error
      if (action.type === 'C') {
      }
    },
    { foo: 'bar' },
  )
}

function* testChannelTakeLeading(): SagaIterator {
  // typings:expect-error
  yield takeLeading(channel)

  // typings:expect-error
  yield takeLeading(channel, (action: Action) => {})
  yield takeLeading(channel, (action: ChannelItem) => {})
  yield takeLeading(channel, action => {
    // typings:expect-error
    action.foo
    action.someField
  })

  const helperWorker1 = (a: 'a', action: ChannelItem) => {}

  // typings:expect-error
  yield takeLeading(channel, helperWorker1)
  // typings:expect-error
  yield takeLeading(channel, helperWorker1, 1)
  yield takeLeading(channel, helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeLeading(channel, helperSaga1)
  // typings:expect-error
  yield takeLeading(channel, helperSaga1, 1)
  yield takeLeading(channel, helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem) => {}

  // typings:expect-error
  yield takeLeading(channel, helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeLeading(channel, helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield takeLeading(channel, helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield takeLeading(channel, helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield takeLeading(eventChannel, (action: ChannelItem) => {})
  yield takeLeading(multicastChannel, (action: ChannelItem) => {})
}

function* testThrottle(): SagaIterator {
  // typings:expect-error
  yield throttle(1)
  // typings:expect-error
  yield throttle(1, 'my-action')

  yield throttle(1, 'my-action', (action: Action) => {})
  yield throttle(1, 'my-action', (action: MyAction) => {})
  yield throttle(1, 'my-action', function*(action: Action): SagaIterator {})
  yield throttle(1, 'my-action', function*(action: MyAction): SagaIterator {})

  const helperWorker1 = (a: 'a', action: MyAction) => {}

  // typings:expect-error
  yield throttle(1, 'my-action', helperWorker1)
  // typings:expect-error
  yield throttle(1, 'my-action', helperWorker1, 1)
  yield throttle(1, 'my-action', helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield throttle(1, 'my-action', helperSaga1)
  // typings:expect-error
  yield throttle(1, 'my-action', helperSaga1, 1)
  yield throttle(1, 'my-action', helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction) => {}

  // typings:expect-error
  yield throttle(1, 'my-action', helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield throttle(1, 'my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield throttle(1, 'my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield throttle(1, 'my-action', helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield throttle(1, 'my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield throttle(1, 'my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield throttle(1, (action: Action) => action.type === 'my-action', (action: Action) => {})
  yield throttle(1, isMyAction, action => action.customField)

  yield throttle(
    1,
    isMyAction,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  // typings:expect-error
  yield throttle(1, () => {}, (action: Action) => {})

  yield throttle(1, stringableActionCreator, action => action.customField)

  yield throttle(
    1,
    stringableActionCreator,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  yield throttle(
    1,
    ['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction],
    (action: Action) => {},
  )

  // test inference of action types from action pattern
  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield throttle(1, [pattern1, pattern2], action => {
    if (action.type === 'A') {
    }

    if (action.type === 'B') {
    }

    // typings:expect-error
    if (action.type === 'C') {
    }
  })
  yield throttle(
    1,
    [pattern1, pattern2],
    (arg: { foo: string }, action: ActionMatchingPattern<typeof pattern1 | typeof pattern2>) => {
      if (action.type === 'A') {
      }

      if (action.type === 'B') {
      }

      // typings:expect-error
      if (action.type === 'C') {
      }
    },
    { foo: 'bar' },
  )
}

function* testChannelThrottle(): SagaIterator {
  // typings:expect-error
  yield throttle(1, channel)

  // typings:expect-error
  yield throttle(1, channel, (action: Action) => {})
  yield throttle(1, channel, (action: ChannelItem) => {})
  yield throttle(1, channel, action => {
    // typings:expect-error
    action.foo
    action.someField
  })

  const helperWorker1 = (a: 'a', action: ChannelItem) => {}

  // typings:expect-error
  yield throttle(1, channel, helperWorker1)
  // typings:expect-error
  yield throttle(1, channel, helperWorker1, 1)
  yield throttle(1, channel, helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield throttle(1, channel, helperSaga1)
  // typings:expect-error
  yield throttle(1, channel, helperSaga1, 1)
  yield throttle(1, channel, helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem) => {}

  // typings:expect-error
  yield throttle(1, channel, helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield throttle(1, channel, helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield throttle(1, channel, helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield throttle(1, channel, helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield throttle(1, eventChannel, (action: ChannelItem) => {})
  yield throttle(1, multicastChannel, (action: ChannelItem) => {})
}

function* testDebounce(): SagaIterator {
  // typings:expect-error
  yield debounce(1)
  // typings:expect-error
  yield debounce(1, 'my-action')

  yield debounce(1, 'my-action', (action: Action) => {})
  yield debounce(1, 'my-action', (action: MyAction) => {})
  yield debounce(1, 'my-action', function*(action: Action): SagaIterator {})
  yield debounce(1, 'my-action', function*(action: MyAction): SagaIterator {})

  const helperWorker1 = (a: 'a', action: MyAction) => {}

  // typings:expect-error
  yield debounce(1, 'my-action', helperWorker1)
  // typings:expect-error
  yield debounce(1, 'my-action', helperWorker1, 1)
  yield debounce(1, 'my-action', helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield debounce(1, 'my-action', helperSaga1)
  // typings:expect-error
  yield debounce(1, 'my-action', helperSaga1, 1)
  yield debounce(1, 'my-action', helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction) => {}

  // typings:expect-error
  yield debounce(1, 'my-action', helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield debounce(1, 'my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield debounce(1, 'my-action', helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: MyAction): SagaIterator {}

  // typings:expect-error
  yield debounce(1, 'my-action', helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  // typings:expect-error
  yield debounce(1, 'my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f')
  yield debounce(1, 'my-action', helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield debounce(1, (action: Action) => action.type === 'my-action', (action: Action) => {})
  yield debounce(1, isMyAction, action => action.customField)

  yield debounce(
    1,
    isMyAction,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  // typings:expect-error
  yield debounce(1, () => {}, (action: Action) => {})

  yield debounce(1, stringableActionCreator, action => action.customField)

  yield debounce(
    1,
    stringableActionCreator,
    (a: { foo: string }, action: MyAction) => {
      a.foo + action.customField
    },
    { foo: 'bar' },
  )

  yield debounce(
    1,
    ['my-action', (action: Action) => action.type === 'my-action', stringableActionCreator, isMyAction],
    (action: Action) => {},
  )

  // test inference of action types from action pattern
  const pattern1: StringableActionCreator<{ type: 'A' }> = null!
  const pattern2: StringableActionCreator<{ type: 'B' }> = null!

  yield debounce(1, [pattern1, pattern2], action => {
    if (action.type === 'A') {
    }

    if (action.type === 'B') {
    }

    // typings:expect-error
    if (action.type === 'C') {
    }
  })
  yield debounce(
    1,
    [pattern1, pattern2],
    (arg: { foo: string }, action: ActionMatchingPattern<typeof pattern1 | typeof pattern2>) => {
      if (action.type === 'A') {
      }

      if (action.type === 'B') {
      }

      // typings:expect-error
      if (action.type === 'C') {
      }
    },
    { foo: 'bar' },
  )
}

function* testChannelDebounce(): SagaIterator {
  // typings:expect-error
  yield debounce(1, channel)

  // typings:expect-error
  yield debounce(1, channel, (action: Action) => {})
  yield debounce(1, channel, (action: ChannelItem) => {})
  yield debounce(1, channel, action => {
    // typings:expect-error
    action.foo
    action.someField
  })

  const helperWorker1 = (a: 'a', action: ChannelItem) => {}

  // typings:expect-error
  yield debounce(1, channel, helperWorker1)
  // typings:expect-error
  yield debounce(1, channel, helperWorker1, 1)
  yield debounce(1, channel, helperWorker1, 'a')

  function* helperSaga1(a: 'a', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield debounce(1, channel, helperSaga1)
  // typings:expect-error
  yield debounce(1, channel, helperSaga1, 1)
  yield debounce(1, channel, helperSaga1, 'a')

  const helperWorker7 = (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem) => {}

  // typings:expect-error
  yield debounce(1, channel, helperWorker7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield debounce(1, channel, helperWorker7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  function* helperSaga7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', action: ChannelItem): SagaIterator {}

  // typings:expect-error
  yield debounce(1, channel, helperSaga7, 1, 'b', 'c', 'd', 'e', 'f', 'g')
  yield debounce(1, channel, helperSaga7, 'a', 'b', 'c', 'd', 'e', 'f', 'g')

  yield debounce(1, eventChannel, (action: ChannelItem) => {})
  yield debounce(1, multicastChannel, (action: ChannelItem) => {})
}

function* testDelay(): SagaIterator {
  // typings:expect-error
  yield delay()
  yield delay(1)
}

function* testRetry(): SagaIterator {
  // typings:expect-error
  yield retry()
  // typings:expect-error
  yield retry(1, 0, 1)
  yield retry(1, 0, () => 1)

  yield retry<() => 'foo'>(1, 0, () => 'foo')
  // typings:expect-error
  yield retry<() => 'bar'>(1, 0, () => 'foo')

  yield retry(1, 0, a => a + 1, 42)
  // typings:expect-error
  yield retry(1, 0, (a: string) => a, 42)
  // typings:expect-error
  yield retry<(a: string) => number>(1, 0, a => a, 42)

  yield retry(1, 0, (a: number, b: number, c: string) => a, 1, 2, '3')
}

declare const promise: Promise<any>

function* testAll(): SagaIterator {
  yield all([call(() => {})])

  // typings:expect-error
  yield all([1])

  // typings:expect-error
  yield all([() => {}])

  // typings:expect-error
  yield all([promise])

  // typings:expect-error
  yield all([1, () => {}, promise])

  yield all({
    named: call(() => {}),
  })

  // typings:expect-error
  yield all({
    named: 1,
  })

  // typings:expect-error
  yield all({
    named: () => {},
  })

  // typings:expect-error
  yield all({
    named: promise,
  })

  // typings:expect-error
  yield all({
    named1: 1,
    named2: () => {},
    named3: promise,
  })
}

function* testNonStrictAll() {
  yield all([1])

  yield all([() => {}])

  yield all([promise])

  yield all([1, () => {}, promise])

  yield all({
    named: 1,
  })

  yield all({
    named: () => {},
  })

  yield all({
    named: promise,
  })

  yield all({
    named1: 1,
    named2: () => {},
    named3: promise,
  })
}

function* testRace(): SagaIterator {
  yield race({
    call: call(() => {}),
  })

  // typings:expect-error
  yield race({
    named: 1,
  })

  // typings:expect-error
  yield race({
    named: () => {},
  })

  // typings:expect-error
  yield race({
    named: promise,
  })

  // typings:expect-error
  yield race({
    named1: 1,
    named2: () => {},
    named3: promise,
  })

  const effectArray = [call(() => {}), call(() => {})]
  yield race([...effectArray])
  // typings:expect-error
  yield race([...effectArray, promise])
}

function* testNonStrictRace() {
  yield race({
    named: 1,
  })

  yield race({
    named: () => {},
  })

  yield race({
    named: promise,
  })

  yield race({
    named1: 1,
    named2: () => {},
    named3: promise,
  })

  const effectArray = [call(() => {}), call(() => {})]
  yield race([...effectArray])
  yield race([...effectArray, promise])
}
