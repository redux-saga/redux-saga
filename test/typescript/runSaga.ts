import {SagaIterator, Task, runSaga, END} from "redux-saga";


function* saga(): SagaIterator {

}

function testRunSaga() {
  const iterator = saga();

  const task1: Task = runSaga(iterator, {});
  const task2: Task = runSaga<{foo : string}, {baz: boolean}>(iterator, {
    subscribe(cb) {
      // typings:expect-error
      cb({});

      cb({foo: 'foo'});
      cb(END);

      return () => {};
    },

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

    logger(level, ...args) {
      console.log(level, ...args);
    },

    onError(error) {
      console.error(error);
    },
  });
}
