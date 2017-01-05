import {Action} from "redux";
import {
  SagaIterator,
  Channel,
  takeEvery,
  takeLatest,
  throttle,
} from "redux-saga";

declare const channel: Channel<{foo: string}>;

function* testTakeEvery(): SagaIterator {
  // typings:expect-error
  yield* takeEvery();
  // typings:expect-error
  yield* takeEvery('foo');
  // typings:expect-error
  yield* takeEvery(channel);

  yield* takeEvery('foo', (action: Action) => {});
  // typings:expect-error
  yield* takeEvery(channel, (action: Action) => {});
  yield* takeEvery(channel, (action: {foo: string}) => {});
  // typings:expect-error
  yield* takeEvery(channel, (a: 'a', action: {foo: string}) => {});
  // typings:expect-error
  yield* takeEvery(channel, (a: 'a', action: {foo: string}) => {}, 1);
  yield* takeEvery(channel, (a: 'a', action: {foo: string}) => {}, 'a');

  // typings:expect-error
  yield* takeEvery(channel, (action: {foo: string}) => {}, 1);

  // typings:expect-error
  yield* takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {foo: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield* takeEvery(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {foo: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );
}

function* testTakeLatest(): SagaIterator {
  // typings:expect-error
  yield* takeLatest();
  // typings:expect-error
  yield* takeLatest('foo');
  // typings:expect-error
  yield* takeLatest(channel);

  yield* takeLatest('foo', (action: Action) => {});
  // typings:expect-error
  yield* takeLatest(channel, (action: Action) => {});
  yield* takeLatest(channel, (action: {foo: string}) => {});
  // typings:expect-error
  yield* takeLatest(channel, (a: 'a', action: {foo: string}) => {});
  // typings:expect-error
  yield* takeLatest(channel, (a: 'a', action: {foo: string}) => {}, 1);
  yield* takeLatest(channel, (a: 'a', action: {foo: string}) => {}, 'a');

  // typings:expect-error
  yield* takeLatest(channel, (action: {foo: string}) => {}, 1);

  // typings:expect-error
  yield* takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {foo: string}) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield* takeLatest(channel,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: {foo: string}) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );
}


function* testThrottle(): SagaIterator {
  const pattern = (action: Action) => action.type === 'foo';

  // typings:expect-error
  yield* throttle();
  // typings:expect-error
  yield* throttle(1);
  // typings:expect-error
  yield* throttle(1, pattern);

  // typings:expect-error
  yield* throttle(1, pattern, (action: {foo: string}) => {});

  yield* throttle(1, pattern, (action: Action) => {});

  yield* throttle(1, pattern, (action: Action) => {});
  // typings:expect-error
  yield* throttle(1, pattern, (a: 'a', action: Action) => {});
  // typings:expect-error
  yield* throttle(1, pattern, (a: 'a', action: Action) => {}, 1);
  yield* throttle(1, pattern, (a: 'a', action: Action) => {}, 'a');

  // typings:expect-error
  yield* throttle(1, pattern, (action: Action) => {}, 1);

  // typings:expect-error
  yield* throttle(1, pattern,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    1, 'b', 'c', 'd', 'e', 'f', 'g'
  );

  yield* throttle(1, pattern,
    (a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g',
     action: Action) => {},
    'a', 'b', 'c', 'd', 'e', 'f', 'g'
  );
}
