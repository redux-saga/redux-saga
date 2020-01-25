import { SagaIterator, channel } from "redux-saga";
import * as RawEffects from "redux-saga/effects";
import * as Effects from "typed-redux-saga";

function* mySaga(): SagaIterator<void> {
  yield* Effects.take("FOO"); // $ExpectType any
  type FooAction = {type: "FOO"};
  yield* Effects.take<FooAction>("FOO"); // $ExpectType FooAction
  yield* Effects.takeMaybe("FOO"); // $ExpectType any

  const chan = channel<"FOO">();
  yield* Effects.take(chan); // $ExpectType "FOO"
  yield* Effects.takeMaybe(chan); // $ExpectType "FOO"

  yield* Effects.takeEvery("FOO", function*() {}); // $ExpectType never
  yield* Effects.takeEvery(chan, function*() {}); // $ExpectType never

  yield* Effects.takeLatest("FOO", function*() {}); // $ExpectType never
  yield* Effects.takeLatest(chan, function*() {}); // $ExpectType never

  yield* Effects.takeLeading("FOO", function*() {}); // $ExpectType never
  yield* Effects.takeLeading(chan, function*() {}); // $ExpectType never

  yield* Effects.put({ type: "FOO" }); // $ExpectType { type: string; }
  yield* Effects.put(chan, "FOO"); // $ExpectType "FOO"

  yield* Effects.putResolve({ type: "FOO" }); // $ExpectType { type: string; }

  // $ExpectType number
  yield* Effects.call(function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  const person = {
    firstName: "John",
    lastName: "Doe",
    id: 5566,
    fullName(): string {
      return `${this.firstName} ${this.lastName}`;
    },
  };

  // $ExpectType string
  yield* Effects.apply(person, "fullName", []);

  // $ExpectType number
  yield* Effects.cps((): number => 22);

  // $ExpectType FixedTask<number>
  let task = yield* Effects.fork(function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  // $ExpectType FixedTask<number>
  task = yield* Effects.spawn(function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  // $ExpectType void
  yield* Effects.join(task);

  // $ExpectType void
  yield* Effects.cancel(task);

  // $ExpectType number
  yield* Effects.select((state: { foo: number }): number => state.foo);

  // $ExpectType Channel<ActionPattern<Action<any>>>
  yield* Effects.actionChannel("FOO");

  // $ExpectType "FOO"[]
  yield* Effects.flush(chan);

  // $ExpectType boolean
  yield* Effects.cancelled();

  // $ExpectType void
  yield* Effects.setContext({ foo: "bar" });

  // $ExpectType string
  yield* Effects.getContext<string>("foo");

  // $ExpectType void
  yield* Effects.delay(120);

  // $ExpectType boolean
  yield* Effects.delay(120, true);

  // $ExpectType never
  yield* Effects.throttle(25, "FOO", function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  // $ExpectType never
  yield* Effects.debounce(25, "FOO", function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  // $ExpectType number
  yield* Effects.retry(5, 100, function*(): SagaIterator<number> {
    yield* Effects.take(chan);
    return 22;
  });

  // $ExpectType number[]
  yield* Effects.all([
    RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
    RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
  ]);

  // $ExpectType { foo: number; bar: string; }
  yield* Effects.all({
    foo: RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
    bar: RawEffects.call(function*(): SagaIterator<string> {
      yield* Effects.take(chan);
      return "hello";
    }),
  });

  // $ExpectType (number | undefined)[]
  yield* Effects.race([
    RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
    RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
  ]);

  // $ExpectType { foo: number | undefined; bar: string | undefined; }
  yield* Effects.race({
    foo: RawEffects.call(function*(): SagaIterator<number> {
      yield* Effects.take(chan);
      return 22;
    }),
    bar: RawEffects.call(function*(): SagaIterator<string> {
      yield* Effects.take(chan);
      return "hello";
    }),
  });
}
