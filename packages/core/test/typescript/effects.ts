import {
  SagaIterator, Channel, EventChannel, MulticastChannel,
  Task, Buffer, END, buffers, detach,
} from 'redux-saga'
import {
  take, takeMaybe, put, putResolve, call, apply, cps, fork, spawn,
  join, cancel, select, actionChannel, cancelled, flush,
  setContext, getContext, takeEvery, throttle, takeLatest, delay, retry,
  all, race, debounce
} from 'redux-saga/effects'
import {Action, ActionCreator} from "redux";


interface MyAction extends Action {
  customField: string;
}

declare const stringableActionCreator: ActionCreator<MyAction>;

Object.assign(stringableActionCreator, {
  toString() {
    return 'my-action';
  },
});

const isMyAction = (action: Action): action is MyAction => {
  return action.type === 'my-action';
};

declare const channel: Channel<{someField: string}>;
declare const eventChannel: EventChannel<{someField: string}>;
declare const multicastChannel: MulticastChannel<{someField: string}>;

function* testTake(): SagaIterator {
  yield take();
  yield take('my-action');
  yield take((action: Action) => action.type === 'my-action');
  yield take(isMyAction);

  // typings:expect-error
  yield take(() => {});

  yield take(stringableActionCreator);

  yield take([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ]);

  // typings:expect-error
  yield take([() => {}]);

  yield takeMaybe([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ]);

  yield take(channel);
  yield takeMaybe(channel);

  yield take(eventChannel);
  yield takeMaybe(eventChannel);

  yield take(multicastChannel);
  yield takeMaybe(multicastChannel);

  // typings:expect-error
  yield take(multicastChannel, (input: {someField: number}) => input.someField === 'foo');
  yield take(multicastChannel, (input: {someField: string}) => input.someField === 'foo');
}

function* testPut(): SagaIterator {
  yield put({type: 'my-action'});

  // typings:expect-error
  yield put(channel, {type: 'my-action'});

  yield put(channel, {someField: '--'});
  yield put(channel, END);

  // typings:expect-error
  yield put(eventChannel, {someField: '--'});
  // typings:expect-error
  yield put(eventChannel, END);

  yield put(multicastChannel, {someField: '--'});
  yield put(multicastChannel, END);

  yield putResolve({type: 'my-action'});

  // typings:expect-error
  yield putResolve(channel, {type: 'my-action'});

  yield putResolve(channel, {someField: '--'});
  yield putResolve(channel, END);

  // typings:expect-error
  yield putResolve(eventChannel, {someField: '--'});
  // typings:expect-error
  yield putResolve(eventChannel, END);

  yield putResolve(multicastChannel, {someField: '--'});
  yield putResolve(multicastChannel, END);
}

function* testCall(): SagaIterator {
  // typings:expect-error
  yield call();

  // typings:expect-error
  yield call({});

  yield call(() => {});

  // typings:expect-error
  yield call((a: 'a') => {});
  // typings:expect-error
  yield call((a: 'a') => {}, 1);
  yield call((a: 'a') => {}, 'a');

  yield call<number, 'a'>((a: 'a') => 1, 'a');

  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 'a');
  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 'a', 1);
  // typings:expect-error
  yield call((a: 'a', b: 'b') => {}, 1, 'b');
  yield call((a: 'a', b: 'b') => {}, 'a', 'b');

  // typings:expect-error
  yield call(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield call(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield call<number, 'a', 'b', 'c', 'd', 'e', 'f'>(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => 1,
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  const obj = {
    foo: 'bar',
    getFoo(arg: string) {
      return this.foo;
    },
  };

  // typings:expect-error
  yield call([obj, obj.foo]);
  // typings:expect-error
  yield call([obj, obj.getFoo]);
  yield call([obj, obj.getFoo], 'bar');
  // typings:expect-error
  yield call([obj, obj.getFoo], 1);

  // typings:expect-error
  yield call([obj, 'foo']);
  // typings:expect-error
  yield call([obj, 'getFoo']);
  // typings:expect-error
  yield call([obj, 'getFoo'], 1);
  yield call([obj, 'getFoo'], 'bar');
  yield call<typeof obj, 'getFoo', string, string>([obj, 'getFoo'], 'bar');

  // typings:expect-error
  yield call({context: obj, fn: obj.foo});
  // typings:expect-error
  yield call({context: obj, fn: obj.getFoo});
  yield call({context: obj, fn: obj.getFoo}, 'bar');
  // typings:expect-error
  yield call({context: obj, fn: obj.getFoo}, 1);

  // typings:expect-error
  yield call({context: obj, fn: 'foo'});
  // typings:expect-error
  yield call({context: obj, fn: 'getFoo'});
  // typings:expect-error
  yield call({context: obj, fn: 'getFoo'}, 1);
  yield call({context: obj, fn: 'getFoo'}, 'bar');
  yield call<typeof obj, 'getFoo', string, string>({context: obj, fn: 'getFoo'}, 'bar');
}

function* testApply(): SagaIterator {
  const obj = {
    foo: 'bar',
    getFoo() {
      return this.foo;
    },
    meth1(a: string) {
      return 1;
    },
    meth2(a: string, b: number) {
      return 1;
    },
    meth7(a: string, b: number, c: string, d: number, e: string, f: number, g: string) {
      return 1;
    },
  };

  // typings:expect-error
  yield apply(obj, obj.foo);
  yield apply(obj, obj.getFoo);
  yield apply<string>(obj, obj.getFoo);

  // typings:expect-error
  yield apply(obj, 'foo');
  yield apply(obj, 'getFoo');
  yield apply<typeof obj, 'getFoo', string>(obj, 'getFoo');

  // typings:expect-error
  yield apply(obj, obj.meth1);
  // typings:expect-error
  yield apply(obj, obj.meth1, []);
  // typings:expect-error
  yield apply(obj, obj.meth1, [1]);
  yield apply(obj, obj.meth1, ['a']);
  yield apply<number, string>(obj, obj.meth1, ['a']);

  // typings:expect-error
  yield apply(obj, 'meth1');
  // typings:expect-error
  yield apply(obj, 'meth1', []);
  // typings:expect-error
  yield apply(obj, 'meth1', [1]);
  yield apply(obj, 'meth1', ['a']);
  yield apply<typeof obj, 'meth1', number, string>(obj, 'meth1', ['a']);

  // typings:expect-error
  yield apply(obj, obj.meth2, ['a']);
  // typings:expect-error
  yield apply(obj, obj.meth2, ['a', 'b']);
  // typings:expect-error
  yield apply(obj, obj.meth2, [1, 'b']);
  yield apply(obj, obj.meth2, ['a', 1]);
  yield apply<number, string, number>(obj, obj.meth2, ['a', 1]);

  // typings:expect-error
  yield apply(obj, 'meth2', ['a']);
  // typings:expect-error
  yield apply(obj, 'meth2', ['a', 'b']);
  // typings:expect-error
  yield apply(obj, 'meth2', [1, 'b']);
  yield apply(obj, 'meth2', ['a', 1]);
  yield apply<typeof obj, 'meth2', number, string, number>(obj, 'meth2', ['a', 1]);

  // typings:expect-error
  yield apply(obj, obj.meth7, [1, 'b', 'c', 'd', 'e', 'f', 'g']);
  yield apply(obj, obj.meth7, ['a', 1, 'b', 2, 'c', 3, 'd']);
  yield apply<number, string, number, string, number, string, number>(
    obj, obj.meth7, ['a', 1, 'b', 2, 'c', 3, 'd'],
  );

  // typings:expect-error
  yield apply(obj, 'meth7', [1, 'b', 'c', 'd', 'e', 'f', 'g']);
  yield apply(obj, 'meth7', ['a', 1, 'b', 2, 'c', 3, 'd']);
  yield apply<typeof obj, 'meth7', number, string, number, string, number, string, number>(
    obj, 'meth7', ['a', 1, 'b', 2, 'c', 3, 'd'],
  );
}

function* testCps(): SagaIterator {
  // typings:expect-error
  yield cps((a: number) => {});

  yield cps((cb) => {cb(null, 1)});

  // typings:expect-error
  yield cps<string>((cb) => {cb(null, 1)});
  yield cps<number>((cb) => {cb(null, 1)});

  yield cps((cb) => {cb.cancel = () => {}});

  // typings:expect-error
  yield cps((a: 'a', cb) => {});
  // typings:expect-error
  yield cps((a: 'a', cb) => {}, 1);
  yield cps((a: 'a', cb) => {}, 'a');

  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb) => {}, 'a');
  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb) => {}, 'a', 1);
  // typings:expect-error
  yield cps((a: 'a', b: 'b', cb) => {}, 1, 'b');
  yield cps((a: 'a', b: 'b', cb) => {}, 'a', 'b');

  // typings:expect-error
  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', cb) => {},
    1, 'b', 'c', 'd'
  );

  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', cb) => {cb(null, 1)},
    'a', 'b', 'c', 'd'
  );
  yield cps<number, 'a', 'b', 'c', 'd'>(
    (a: 'a', b: 'b', c: 'c', d: 'd', cb) => {cb(null, 1)},
    'a', 'b', 'c', 'd'
  );

  // typings:expect-error
  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb) => {},
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb) => {cb(null, 1)},
    'a', 'b', 'c', 'd', 'e', 'f'
  );
  yield cps<number, 'a', 'b', 'c', 'd', 'e'>(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb) => {cb(null, 1)},
    'a', 'b', 'c', 'd', 'e', 'f'
  );

  const obj = {
    foo: 'bar',
    getFoo(arg: string, cb: (error: any, result: string) => void) {
      cb(null, this.foo);
    },
  };

  // typings:expect-error
  yield cps([obj, obj.foo]);
  // typings:expect-error
  yield cps([obj, obj.getFoo]);
  // typings:expect-error
  yield cps([obj, obj.getFoo], 1);
  yield cps([obj, obj.getFoo], 'bar');
  yield cps<string, string>([obj, obj.getFoo], 'bar');

  // typings:expect-error
  yield cps([obj, 'foo']);
  // typings:expect-error
  yield cps([obj, 'getFoo']);
  // typings:expect-error
  yield cps([obj, 'getFoo'], 1);
  yield cps([obj, 'getFoo'], 'bar');
  yield cps<typeof obj, 'getFoo', string, string>([obj, 'getFoo'], 'bar');

  // typings:expect-error
  yield cps({context: obj, fn: obj.foo});
  // typings:expect-error
  yield cps({context: obj, fn: obj.getFoo});
  // typings:expect-error
  yield cps({context: obj, fn: obj.getFoo}, 1);
  yield cps<string, string>({context: obj, fn: obj.getFoo}, 'bar');

  // typings:expect-error
  yield cps({context: obj, fn: 'foo'});
  // typings:expect-error
  yield cps({context: obj, fn: 'getFoo'});
  // typings:expect-error
  yield cps({context: obj, fn: 'getFoo'}, 1);
  yield cps({context: obj, fn: 'getFoo'}, 'bar');
  yield cps<typeof obj, 'getFoo', string, string>({context: obj, fn: 'getFoo'}, 'bar');
}

function* testFork(): SagaIterator {
  // typings:expect-error
  yield fork();

  yield fork(() => {});

  // typings:expect-error
  yield fork((a: 'a') => {});
  // typings:expect-error
  yield fork((a: 'a') => {}, 1);
  yield fork((a: 'a') => {}, 'a');

  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 'a');
  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 'a', 1);
  // typings:expect-error
  yield fork((a: 'a', b: 'b') => {}, 1, 'b');
  yield fork((a: 'a', b: 'b') => {}, 'a', 'b');

  // typings:expect-error
  yield fork(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield fork(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  const obj = {
    foo: 'bar',
    getFoo(arg: string) {
      return this.foo;
    },
  };

  // typings:expect-error
  yield fork([obj, obj.foo]);
  // typings:expect-error
  yield fork([obj, obj.getFoo]);
  yield fork([obj, obj.getFoo], 'bar');
  // typings:expect-error
  yield fork([obj, obj.getFoo], 1);

  // typings:expect-error
  yield fork([obj, 'foo']);
  // typings:expect-error
  yield fork([obj, 'getFoo']);
  yield fork([obj, 'getFoo'], 'bar');
  // typings:expect-error
  yield fork([obj, 'getFoo'], 1);

  // typings:expect-error
  yield fork({context: obj, fn: obj.foo});
  // typings:expect-error
  yield fork({context: obj, fn: obj.getFoo});
  yield fork({context: obj, fn: obj.getFoo}, 'bar');
  // typings:expect-error
  yield fork({context: obj, fn: obj.getFoo}, 1);

  // typings:expect-error
  yield fork({context: obj, fn: 'foo'});
  // typings:expect-error
  yield fork({context: obj, fn: 'getFoo'});
  yield fork({context: obj, fn: 'getFoo'}, 'bar');
  // typings:expect-error
  yield fork({context: obj, fn: 'getFoo'}, 1);
}

function* testSpawn(): SagaIterator {
  // typings:expect-error
  yield spawn();

  yield spawn(() => {});

  // typings:expect-error
  yield spawn((a: 'a') => {});
  // typings:expect-error
  yield spawn((a: 'a') => {}, 1);
  yield spawn((a: 'a') => {}, 'a');

  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 'a');
  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 'a', 1);
  // typings:expect-error
  yield spawn((a: 'a', b: 'b') => {}, 1, 'b');
  yield spawn((a: 'a', b: 'b') => {}, 'a', 'b');

  // typings:expect-error
  yield spawn(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield spawn(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  const obj = {
    foo: 'bar',
    getFoo(arg: string) {
      return this.foo;
    },
  };

  // typings:expect-error
  yield spawn([obj, obj.foo]);
  // typings:expect-error
  yield spawn([obj, obj.getFoo]);
  yield spawn([obj, obj.getFoo], 'bar');
  // typings:expect-error
  yield spawn([obj, obj.getFoo], 1);

  // typings:expect-error
  yield spawn([obj, 'foo']);
  // typings:expect-error
  yield spawn([obj, 'getFoo']);
  yield spawn([obj, 'getFoo'], 'bar');
  // typings:expect-error
  yield spawn([obj, 'getFoo'], 1);

  // typings:expect-error
  yield spawn({context: obj, fn: obj.foo});
  // typings:expect-error
  yield spawn({context: obj, fn: obj.getFoo});
  yield spawn({context: obj, fn: obj.getFoo}, 'bar');
  // typings:expect-error
  yield spawn({context: obj, fn: obj.getFoo}, 1);

  // typings:expect-error
  yield spawn({context: obj, fn: 'foo'});
  // typings:expect-error
  yield spawn({context: obj, fn: 'getFoo'});
  yield spawn({context: obj, fn: 'getFoo'}, 'bar');
  // typings:expect-error
  yield spawn({context: obj, fn: 'getFoo'}, 1);
}


declare const task: Task;

function* testJoin(): SagaIterator {
  // typings:expect-error
  yield join();

  // typings:expect-error
  yield join({});

  yield join(task);
  yield join(task, task);
  yield join(task, task, task);

  // typings:expect-error
  yield join(task, task, {});
}

function* testCancel(): SagaIterator {
  yield cancel();

  // typings:expect-error
  yield cancel(undefined);
  // typings:expect-error
  yield cancel({});

  yield cancel(task);
  yield cancel(task, task);
  yield cancel(task, task, task);

  const tasks: Task[] = [];

  yield cancel(...tasks);

  // typings:expect-error
  yield cancel(task, task, {});
}

function* testDetach(): SagaIterator {
  yield detach(fork(() => {}));

  // typings:expect-error
  yield detach(call(() => {}));
}

function* testSelect(): SagaIterator {
  type State = {foo: string};

  yield select();

  yield select((state: State) => state.foo);
  // typings:expect-error
  yield select<State, number>((state: State) => state.foo);
  yield select<State, string>((state: State) => state.foo);

  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo);
  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo, 1);
  yield select((state: State, a: 'a') => state.foo, 'a');
  yield select<State, string, 'a'>((state: State, a: 'a') => state.foo, 'a');

  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a');
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 1);
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 1, 'b');
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 'b');
  yield select<State, string, 'a', 'b'>((state: State, a: 'a', b: 'b') => state.foo, 'a', 'b');

  // typings:expect-error
  yield select((state: State,
                a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield select((state: State,
                a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    'a', 'b', 'c', 'd', 'e', 'f'
  );
  yield select<State, string, 'a', 'b', 'c', 'd', 'e'>((state: State,
                a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    'a', 'b', 'c', 'd', 'e', 'f'
);
}

declare const actionBuffer: Buffer<Action>;
declare const nonActionBuffer: Buffer<{someField: string}>;

function* testActionChannel(): SagaIterator {
  // typings:expect-error
  yield actionChannel();

  /* action type */

  yield actionChannel('my-action');
  yield actionChannel('my-action', actionBuffer);
  // typings:expect-error
  yield actionChannel('my-action', nonActionBuffer);

  /* action predicate */

  yield actionChannel(
    (action: Action) => action.type === 'my-action',
  );
  yield actionChannel(
    (action: Action) => action.type === 'my-action',
    actionBuffer,
  );
  // typings:expect-error
  yield actionChannel(
    (action: Action) => action.type === 'my-action',
    nonActionBuffer,
  );
  // typings:expect-error
  yield actionChannel(
    (item: {someField: string}) => item.someField === '--',
    actionBuffer
  );

  // typings:expect-error
  yield actionChannel(() => {});
  // typings:expect-error
  yield actionChannel(() => {}, actionBuffer);

  /* stringable action creator */

  yield actionChannel(stringableActionCreator);

  yield actionChannel(stringableActionCreator, buffers.fixed<MyAction>());
  // typings:expect-error
  yield actionChannel(stringableActionCreator, nonActionBuffer);


  /* array */

  yield actionChannel([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
  ]);

  // typings:expect-error
  yield actionChannel([() => {}]);
}

function* testCancelled(): SagaIterator {
  yield cancelled();
  // typings:expect-error
  yield cancelled(1);
}

function* testFlush(): SagaIterator {
  // typings:expect-error
  yield flush();
  // typings:expect-error
  yield flush({});

  yield flush(channel);
  yield flush(eventChannel);
  // typings:expect-error
  yield flush(multicastChannel);
}

function* testGetContext(): SagaIterator {
  // typings:expect-error
  yield getContext();

  // typings:expect-error
  yield getContext({});

  yield getContext('prop');
}

function* testSetContext(): SagaIterator {
  // typings:expect-error
  yield setContext();

  // typings:expect-error
  yield setContext('prop');

  yield setContext({prop: 1});
}

function* testTakeEvery(): SagaIterator {
  // typings:expect-error
  yield takeEvery();
  // typings:expect-error
  yield takeEvery('my-action');

  yield takeEvery('my-action', (action: Action) => {});
  yield takeEvery('my-action', (action: MyAction) => {});
  // typings:expect-error
  yield takeEvery('my-action', (a: 'a', action: MyAction) => {});
  // typings:expect-error
  yield takeEvery('my-action', (a: 'a', action: MyAction) => {}, 1);
  yield takeEvery('my-action', (a: 'a', action: MyAction) => {}, 'a');

  // typings:expect-error
  yield takeEvery('my-action', (action: MyAction) => {}, 1);

  // typings:expect-error
  yield takeEvery('my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: MyAction) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeEvery('my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: MyAction) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeEvery((action: Action) => action.type === 'my-action',
                  (action: Action) => {});
  yield takeEvery(isMyAction, action => action.customField);

  yield takeEvery(isMyAction, (a, action) => {a.foo + action.customField}, {foo: 'bar'});

  // typings:expect-error
  yield takeEvery(() => {}, (action: Action) => {});

  yield takeEvery(stringableActionCreator, action => action.customField);

  yield takeEvery(stringableActionCreator, (a, action) => {a.foo + action.customField}, {foo: 'bar'});

  yield takeEvery([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ], (action: Action) => {});
}

function* testChannelTakeEvery(): SagaIterator {
  // typings:expect-error
  yield takeEvery(channel);

  // typings:expect-error
  yield takeEvery(channel, (action: Action) => {});
  yield takeEvery(channel, (action: {someField: string}) => {});
  // typings:expect-error
  yield takeEvery(channel, (a: 'a', action: {someField: string}) => {});
  // typings:expect-error
  yield takeEvery(channel, (a: 'a', action: {someField: string}) => {}, 1);
  yield takeEvery(channel, (a: 'a', action: {someField: string}) => {}, 'a');

  // typings:expect-error
  yield takeEvery(channel, (action: {someField: string}) => {}, 1);

  // typings:expect-error
  yield takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {someField: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {someField: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeEvery(eventChannel, (action: {someField: string}) => {});
  yield takeEvery(multicastChannel, (action: {someField: string}) => {});
}

function* testTakeLatest(): SagaIterator {
  // typings:expect-error
  yield takeLatest();
  // typings:expect-error
  yield takeLatest('my-action');

  yield takeLatest('my-action', (action: Action) => {});
  yield takeLatest('my-action', (action: MyAction) => {});
  // typings:expect-error
  yield takeLatest('my-action', (a: 'a', action: MyAction) => {});
  // typings:expect-error
  yield takeLatest('my-action', (a: 'a', action: MyAction) => {}, 1);
  yield takeLatest('my-action', (a: 'a', action: MyAction) => {}, 'a');

  // typings:expect-error
  yield takeLatest('my-action', (action: MyAction) => {}, 1);

  // typings:expect-error
  yield takeLatest('my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: MyAction) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeLatest('my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: MyAction) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeLatest((action: Action) => action.type === 'my-action',
    (action: Action) => {});
  yield takeLatest(isMyAction, action => action.customField);

  yield takeLatest(isMyAction, (a, action) => {a.foo + action.customField}, {foo: 'bar'});

  // typings:expect-error
  yield takeLatest(() => {}, (action: Action) => {});

  yield takeLatest(stringableActionCreator, action => action.customField);

  yield takeLatest(stringableActionCreator, (a, action) => {a.foo + action.customField}, {foo: 'bar'});

  yield takeLatest([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ], (action: Action) => {});
}

function* testChannelTakeLatest(): SagaIterator {
  // typings:expect-error
  yield takeLatest(channel);

  // typings:expect-error
  yield takeLatest(channel, (action: Action) => {});
  yield takeLatest(channel, (action: {someField: string}) => {});
  // typings:expect-error
  yield takeLatest(channel, (a: 'a', action: {someField: string}) => {});
  // typings:expect-error
  yield takeLatest(channel, (a: 'a', action: {someField: string}) => {}, 1);
  yield takeLatest(channel, (a: 'a', action: {someField: string}) => {}, 'a');

  // typings:expect-error
  yield takeLatest(channel, (action: {someField: string}) => {}, 1);

  // typings:expect-error
  yield takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {someField: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {someField: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield takeLatest(eventChannel, (action: {someField: string}) => {});
  yield takeLatest(multicastChannel, (action: {someField: string}) => {});
}

function* testThrottle(): SagaIterator {
  // typings:expect-error
  yield throttle();
  // typings:expect-error
  yield throttle(1);

  /* action type */

  yield throttle(1, 'my-action', (action: Action) => {});
  // typings:expect-error
  yield throttle(1, 'my-action');
  // typings:expect-error
  yield throttle(1, 'my-action', (action: {someField: string}) => {});
  // typings:expect-error
  yield throttle(1, 'my-action', (a: 'a', action: Action) => {});
  // typings:expect-error
  yield throttle(1, 'my-action', (a: 'a', action: Action) => {}, 1);
  yield throttle(1, 'my-action', (a: 'a', action: Action) => {}, 'a');

  // typings:expect-error
  yield throttle(1, 'my-action', (action: Action) => {}, 1);

  // typings:expect-error
  yield throttle(1, 'my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield throttle(1, 'my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );

  /* action predicate */

  yield throttle(1,
    (action: Action) => action.type === 'my-action',
    (action: Action) => {},
  );

  yield throttle(1,
    (action: Action) => action.type === 'my-action',
    (action: Action) => {},
  );
  yield throttle(1,
    (action: Action) => action.type === 'my-action',
    (a: 'a', action: Action) => {},
    'a',
  );

  yield throttle(1,
    (action: Action) => action.type === 'my-action',
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g',
  );

  yield throttle(1,
    isMyAction,
    action => action.customField,
  );

  yield throttle(1,
    isMyAction,
    (a, action) => action.customField + a.foo,
    {foo: 'a'},
  );

  yield throttle(1,
    stringableActionCreator,
    action => action.customField,
  );

  yield throttle(1,
    stringableActionCreator,
    (a, action) => action.customField + a.foo,
    {foo: 'a'},
  );

  yield throttle(1,
    stringableActionCreator,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g',
  );
}

function* testDelay(): SagaIterator {
  // typings:expect-error
  yield delay();
  yield delay(1);
  // typings:expect-error
  yield delay<'result'>(1, 'foo');
  yield delay<'result'>(1, 'result');
  yield delay(1, 'result');
}

function* testRetry(): SagaIterator {
  // typings:expect-error
  yield retry();
  // typings:expect-error
  yield retry(1, 0, 1);
  yield retry(1, 0, () => 1);

  yield retry<'foo'>(1, 0, () => 'foo');
  // typings:expect-error
  yield retry<'bar'>(1, 0, () => 'foo');

  yield retry(1, 0, (a) => a + 1, 42);
  // typings:expect-error
  yield retry(1, 0, (a: string) => a, 42);
  // typings:expect-error
  yield retry<string, number>(1, 0, (a) => a, 42);

  yield retry(1, 0, (a: number, b: number, c: string) => a, 1, 2, '3', 4, 5, '6', 7);
}

function* testDebounce(): SagaIterator {
  // typings:expect-error
  yield debounce();
  // typings:expect-error
  yield debounce(1);

  /* action type */
  yield debounce(1, 'my-action', (action: Action) => 1);

  yield debounce(10, 'my-action', (arg1: number, action: Action) => arg1 + 1, 2);
  // typings:expect-error
  yield debounce(10, 'my-action', (arg1: number, action: Action) => arg1 + 1, '2');

  yield debounce(1, 'my-action',
    (a: number, b: number, c: string, d: number, e: number, f: string, g: number, h: Action) => a,
    1, 2, '3', 4, 5, '6', 7
  );

  yield debounce(1, ['my-action'], (action: Action) => 1);

  /* action predicate */

  yield debounce(1,
    (action: Action) => action.type === 'my-action',
    (arg1: number, action: Action) => 1,
    42
  );

  // typings:expect-error
  yield debounce(1,
    (action: Action) => action.type === 'my-action',
    (arg1: string, action: Action) => 1,
    42
  );

  yield debounce(1,
    isMyAction,
    (a, action) => action.customField + a.foo,
    {foo: 'a'},
  );

  yield debounce(1,
    stringableActionCreator,
    action => action.customField,
  );

  // typings:expect-error
  yield debounce(1,
    stringableActionCreator,
    (arg1: string, action: Action) => action.customField,
    42
  );

  /* channel */

  yield debounce(1, channel, (action: {someField: string}) => {});
  // typings:expect-error
  yield debounce(1, channel, (action: Action) => {});
  yield debounce(1, channel, (arg1: number, action: {someField: string}) => {}, 42);
}



declare const promise: Promise<any>;

function* testAll(): SagaIterator {
  yield all([
    call(() => {}),
  ]);

  // typings:expect-error
  yield all([1]);

  // typings:expect-error
  yield all([
    () => {}
  ]);

  // typings:expect-error
  yield all([
    promise,
  ]);

  // typings:expect-error
  yield all([
    1,
    () => {},
    promise,
  ]);

  yield all({
    named: call(() => {}),
  });

  // typings:expect-error
  yield all({
    named: 1,
  });

  // typings:expect-error
  yield all({
    named: () => {},
  });

  // typings:expect-error
  yield all({
    named: promise,
  });

  // typings:expect-error
  yield all({
    named1: 1,
    named2: () => {},
    named3: promise,
  });
}

function* testNonStrictAll() {
  yield all([1]);

  yield all([
    () => {}
  ]);

  yield all([
    promise,
  ]);

  yield all([
    1,
    () => {},
    promise,
  ]);

  yield all({
    named: 1,
  });

  yield all({
    named: () => {},
  });

  yield all({
    named: promise,
  });

  yield all({
    named1: 1,
    named2: () => {},
    named3: promise,
  });
}

function* testRace(): SagaIterator {
  yield race({
    call: call(() => {})
  });

  // typings:expect-error
  yield race({
    named: 1,
  });

  // typings:expect-error
  yield race({
    named: () => {},
  });

  // typings:expect-error
  yield race({
    named: promise,
  });

  // typings:expect-error
  yield race({
    named1: 1,
    named2: () => {},
    named3: promise,
  });
}

function* testNonStrictRace() {
  yield race({
    named: 1,
  });

  yield race({
    named: () => {},
  });

  yield race({
    named: promise,
  });

  yield race({
    named1: 1,
    named2: () => {},
    named3: promise,
  });
}








