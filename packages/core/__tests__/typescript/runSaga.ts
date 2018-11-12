import { SagaIterator, Task, runSaga, END, MulticastChannel } from 'redux-saga';
import { call, ValidEffect } from "redux-saga/effects";

declare const stdChannel: MulticastChannel<any>;
declare const promise: Promise<any>;
declare const effect: ValidEffect
declare const iterator: Iterator<any>;


function testRunSaga() {
  const task0: Task = runSaga<{foo : string}, {baz: boolean}>({
    context: {a: 42},

    channel: stdChannel,

    effectMiddlewares: [
      next => effect => {
        setTimeout(() => {
          next(effect);
        }, 10);
      },
      next => effect => {
        setTimeout(() => {
          next(effect);
        }, 10);
      },
    ],

    getState() {
      return {baz: true};
    },

    dispatch(input) {
      input.foo;
      // typings:expect-error
      input.bar;
    },

    sagaMonitor: {
      effectTriggered() {},
      effectResolved() {},
      effectRejected() {},
      effectCancelled() {},
      actionDispatched() {},
    },

    onError(error) {
      console.error(error);
    },
  }, function* saga(): SagaIterator {yield effect});

  // typings:expect-error
  runSaga();

  // typings:expect-error
  runSaga({});

  // typings:expect-error
  runSaga({}, iterator);

  runSaga({}, function* saga(): SagaIterator {yield effect});

  // typings:expect-error
  runSaga({}, function* saga(a: 'a'): SagaIterator {yield effect});

  // typings:expect-error
  runSaga({}, function* saga(a: 'a'): SagaIterator {yield effect}, 1);

  runSaga({}, function* saga(a: 'a'): SagaIterator {yield effect}, 'a');

  // typings:expect-error
  runSaga({}, function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a');

  // typings:expect-error
  runSaga({}, function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a', 1);

  // typings:expect-error
  runSaga({}, function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    1, 'b');

  runSaga({}, function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a', 'b');

  runSaga({}, function* saga(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
                                g: 'g'): SagaIterator {yield effect},
    'a', 'b', 'c', 'd', 'e', 'f', 'g');

  // typings:expect-error
  runSaga({}, function* saga(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
                                g: 'g'): SagaIterator {yield effect},
    1, 'b', 'c', 'd', 'e', 'f', 'g');


  // test with any iterator i.e. when generator doesn't always yield Effects.

  runSaga({}, function* saga() {
    yield promise;
  });

  // typings:expect-error
  runSaga({context: 42}, function* saga(): SagaIterator {yield effect});
}
