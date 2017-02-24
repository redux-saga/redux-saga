import createSagaMiddleware, {SagaIterator} from 'redux-saga'
import {Effect} from 'redux-saga/effects'
import {applyMiddleware} from 'redux'



function testApplyMiddleware() {
  const middleware = createSagaMiddleware()

  const enhancer = applyMiddleware(middleware)
}

declare const effect: Effect
declare const promise: Promise<any>;

function testRun() {
  const middleware = createSagaMiddleware()

  middleware.run(function* saga(): SagaIterator {yield effect});

  // typings:expect-error
  middleware.run(function* saga(a: 'a'): SagaIterator {yield effect});

  // typings:expect-error
  middleware.run(function* saga(a: 'a'): SagaIterator {yield effect}, 1);

  middleware.run(function* saga(a: 'a'): SagaIterator {yield effect}, 'a');

  // typings:expect-error
  middleware.run(function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a');

  // typings:expect-error
  middleware.run(function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a', 1);

  // typings:expect-error
  middleware.run(function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    1, 'b');

  middleware.run(function* saga(a: 'a', b: 'b'): SagaIterator {yield effect},
    'a', 'b');

  middleware.run(function* saga(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
                                g: 'g'): SagaIterator {yield effect},
    'a', 'b', 'c', 'd', 'e', 'f', 'g');

  // typings:expect-error
  middleware.run(function* saga(a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f',
                                g: 'g'): SagaIterator {yield effect},
    1, 'b', 'c', 'd', 'e', 'f', 'g');


  // test with any iterator i.e. when generator doesn't always yield Effects.

  middleware.run(function* saga() {
    yield promise;
  })
}

function testOptions() {
  const noOptions = createSagaMiddleware({});

  const withOptions = createSagaMiddleware({
    onError(error) {
      console.error(error);
    },

    logger(level, ...args) {
      console.log(level, ...args);
    },

    sagaMonitor: {
      effectTriggered() { },
    },

    emitter: emit => action => {
      if (Array.isArray(action)) {
        action.forEach(emit);
        return
      }
      emit(action);
    },
  });

  const withMonitor = createSagaMiddleware({
    sagaMonitor: {
      effectTriggered() {},
      effectResolved() {},
      effectRejected() {},
      effectCancelled() {},
      actionDispatched() {},
    }
  });
}
