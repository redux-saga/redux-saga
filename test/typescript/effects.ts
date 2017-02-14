import {SagaIterator, Channel, Task, Buffer, END, buffers} from 'redux-saga'
import {
  take, takem, put, call, apply, cps, fork, spawn,
  join, cancel, select, actionChannel, cancelled, flush, takeEvery, throttle,
  takeLatest, race,
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

  yield take.maybe([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ]);

  yield take(channel);

  yield take.maybe(channel);

  yield takem([
    'my-action',
    (action: Action) => action.type === 'my-action',
    stringableActionCreator,
    isMyAction,
  ]);

  yield takem(channel);
}

function* testPut(): SagaIterator {
  yield put({type: 'my-action'});

  // typings:expect-error
  yield put(channel, {type: 'my-action'});

  yield put(channel, {someField: '--'});
  yield put(channel, END);

  yield put.resolve({type: 'my-action'});
  yield put.resolve(channel, {someField: '--'});
  yield put.resolve(channel, END);

  yield put.sync({type: 'my-action'});
  yield put.sync(channel, {someField: '--'});
  yield put.sync(channel, END);
}

function* testCall(): SagaIterator {
  // typings:expect-error
  yield call();

  yield call(() => {});

  // typings:expect-error
  yield call((a: 'a') => {});
  // typings:expect-error
  yield call((a: 'a') => {}, 1);
  yield call((a: 'a') => {}, 'a');

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

  const obj = {
    foo: 'bar',
    getFoo() {
      return this.foo;
    },
  };

  yield call([obj, obj.getFoo]);
  yield call({context: obj, fn: obj.getFoo});
}

function* testApply(): SagaIterator {
  const obj = {
    foo: 'bar',
    getFoo() {
      return this.foo;
    },
    meth1(a: 'a') {},
    meth2(a: 'a', b: 'b') {},
    meth7(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g') {},
  };

  yield apply(obj, obj.getFoo);
  // typings:expect-error
  yield apply(obj, obj.meth1);
  // typings:expect-error
  yield apply(obj, obj.meth1, []);
  // typings:expect-error
  yield apply(obj, obj.meth1, [1]);
  yield apply(obj, obj.meth1, ['a']);

  // typings:expect-error
  yield apply(obj, obj.meth2, ['a'])
  // typings:expect-error
  yield apply(obj, obj.meth2, ['a', 1])
  // typings:expect-error
  yield apply(obj, obj.meth2, [1, 'b'])
  yield apply(obj, obj.meth2, ['a', 'b'])

  // typings:expect-error
  yield apply(obj, obj.meth7, [1, 'b', 'c', 'd', 'e', 'f', 'g']);
  yield apply(obj, obj.meth7, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
}

function* testCps(): SagaIterator {
  // typings:expect-error
  yield cps((a: number) => {});

  yield cps((cb) => {cb(null, 1)});

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
    (a: 'a', b: 'b', c: 'c', d: 'd', cb) => {},
    'a', 'b', 'c', 'd'
  );

  // typings:expect-error
  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb) => {},
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield cps(
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', cb) => {},
    'a', 'b', 'c', 'd', 'e', 'f'
  );

  const obj = {
    foo: 'bar',
    getFoo(cb: (error: any, result: string) => void) {
      cb(null, this.foo);
    },
  };

  yield cps([obj, obj.getFoo]);
  yield cps({context: obj, fn: obj.getFoo});
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
    getFoo() {
      return this.foo;
    },
  };

  yield fork([obj, obj.getFoo]);
  yield fork({context: obj, fn: obj.getFoo});
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
    getFoo() {
      return this.foo;
    },
  };

  yield spawn([obj, obj.getFoo]);
  yield spawn({context: obj, fn: obj.getFoo});
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
  // typings:expect-error
  yield cancel();
  // typings:expect-error
  yield cancel({});

  yield cancel(task);
  yield cancel(task, task);
  yield cancel(task, task, task);

  // typings:expect-error
  yield cancel(task, task, {});
}

function* testSelect(): SagaIterator {
  type State = {foo: string};

  yield select();

  yield select((state: State) => state.foo);

  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo);
  // typings:expect-error
  yield select((state: State, a: 'a') => state.foo, 1);
  yield select((state: State, a: 'a') => state.foo, 'a');

  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a');
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 1);
  // typings:expect-error
  yield select((state: State, a: 'a', b: 'b') => state.foo, 1, 'b');
  yield select((state: State, a: 'a', b: 'b') => state.foo, 'a', 'b');

  // typings:expect-error
  yield select((state: State,
                a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f') => state.foo,
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield select((state: State,
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

  /* stringable action creator */
  yield throttle(1,
    stringableActionCreator,
    (action: Action) => {},
  );

  yield throttle(1,
    stringableActionCreator,
    (action: Action) => {},
  );
  yield throttle(1,
    stringableActionCreator,
    (a: 'a', action: Action) => {},
    'a',
  );

  yield throttle(1,
    stringableActionCreator,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g',
  );
}

function* testParallel(): SagaIterator {
  yield [
    call(() => {}),
  ];

  // typings:expect-error
  yield [1];

  // typings:expect-error
  yield [
    () => {}
  ];
}

function* testRace(): SagaIterator {
  yield race({
    call: call(() => {})
  });

  // typings:expect-error
  yield race({
    call: 1
  });

  // typings:expect-error
  yield race({
    call: () => {}
  });
}








