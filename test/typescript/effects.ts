import {SagaIterator, Channel, Task, Buffer, END} from 'redux-saga'
import {
  take, put, call, apply, cps, fork, spawn,
  join, cancel, select, actionChannel, cancelled, flush, takeEvery, throttle,
  takeLatest, race,
} from 'redux-saga/effects'
import {Action, ActionCreator} from "redux";


declare const actionCreator: ActionCreator<Action>;

Object.assign(actionCreator, {
  toString() {
    return 'foo'
  }
});

declare const channel: Channel<{foo: string}>;

function* testTake(): SagaIterator {
  yield take();
  yield take('*');
  yield take('foo');
  yield take((action: Action) => action.type === 'foo');

  // typings:expect-error
  yield take(() => {});

  yield take(actionCreator);

  yield take([
    'foo',
    (action: Action) => action.type === 'foo',
    actionCreator,
  ]);

  // typings:expect-error
  yield take([() => {}]);

  yield take.maybe([
    'foo',
    (action: Action) => action.type === 'foo',
    actionCreator,
  ]);

  yield take(channel);

  yield take.maybe(channel);
}

function* testPut(): SagaIterator {
  yield put({type: 'foo'});

  // typings:expect-error
  yield put(channel, {type: 'foo'});

  yield put(channel, {foo: 'bar'});
  yield put(channel, END);

  yield put.resolve({type: 'foo'});
  yield put.resolve(channel, {foo: 'bar'});
  yield put.resolve(channel, END);
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

declare const buffer: Buffer<{foo: string}>;

function* testActionChannel(): SagaIterator {
  // typings:expect-error
  yield actionChannel();
  yield actionChannel('*');
  yield actionChannel('foo');
  yield actionChannel((action: Action) => action.type === 'foo');

  // typings:expect-error
  yield actionChannel(() => {});

  yield actionChannel(actionCreator);

  yield actionChannel([
    'foo',
    (action: Action) => action.type === 'foo',
    actionCreator,
  ]);

  // typings:expect-error
  yield actionChannel([() => {}]);

  yield actionChannel(
    (item: {foo: string}) => item.foo === 'foo',
    buffer
  );

  // typings:expect-error
  yield actionChannel(
    (item: {bar: string}) => item.bar === 'foo',
    buffer
  );

  // typings:expect-error
  yield actionChannel('foo', {});
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
  yield takeEvery('foo');
  // typings:expect-error
  yield takeEvery(channel);

  yield takeEvery('foo', (action: Action) => {});
  // typings:expect-error
  yield takeEvery(channel, (action: Action) => {});
  yield takeEvery(channel, (action: {foo: string}) => {});
  // typings:expect-error
  yield takeEvery(channel, (a: 'a', action: {foo: string}) => {});
  // typings:expect-error
  yield takeEvery(channel, (a: 'a', action: {foo: string}) => {}, 1);
  yield takeEvery(channel, (a: 'a', action: {foo: string}) => {}, 'a');

  // typings:expect-error
  yield takeEvery(channel, (action: {foo: string}) => {}, 1);

  // typings:expect-error
  yield takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: {foo: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: {foo: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f'
  );
}

function* testTakeLatest(): SagaIterator {
  // typings:expect-error
  yield takeLatest();
  // typings:expect-error
  yield takeLatest('foo');
  // typings:expect-error
  yield takeLatest(channel);

  yield takeLatest('foo', (action: Action) => {});
  // typings:expect-error
  yield takeLatest(channel, (action: Action) => {});
  yield takeLatest(channel, (action: {foo: string}) => {});
  // typings:expect-error
  yield takeLatest(channel, (a: 'a', action: {foo: string}) => {});
  // typings:expect-error
  yield takeLatest(channel, (a: 'a', action: {foo: string}) => {}, 1);
  yield takeLatest(channel, (a: 'a', action: {foo: string}) => {}, 'a');

  // typings:expect-error
  yield takeLatest(channel, (action: {foo: string}) => {}, 1);

  // typings:expect-error
  yield takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: {foo: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: {foo: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f'
  );
}


function* testThrottle(): SagaIterator {
  const pattern = (action: Action) => action.type === 'foo';

  // typings:expect-error
  yield throttle();
  // typings:expect-error
  yield throttle(1);
  // typings:expect-error
  yield throttle(1, pattern);

  // typings:expect-error
  yield throttle(1, pattern, (action: {foo: string}) => {});

  yield throttle(1, pattern, (action: Action) => {});

  yield throttle(1, pattern, (action: Action) => {});
  // typings:expect-error
  yield throttle(1, pattern, (a: 'a', action: Action) => {});
  // typings:expect-error
  yield throttle(1, pattern, (a: 'a', action: Action) => {}, 1);
  yield throttle(1, pattern, (a: 'a', action: Action) => {}, 'a');

  // typings:expect-error
  yield throttle(1, pattern, (action: Action) => {}, 1);

  // typings:expect-error
  yield throttle(1, pattern,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: Action) => {},
    1, 'b', 'c', 'd', 'e', 'f'
  );

  yield throttle(1, pattern,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f'
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








