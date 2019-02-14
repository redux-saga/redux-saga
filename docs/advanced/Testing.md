# Testing Sagas

There are two main ways to test Sagas: testing the saga generator function step-by-step or running the full saga and
asserting the side effects.

## Testing the Saga Generator Function

Suppose we have the following actions:

```javascript
const CHOOSE_COLOR = 'CHOOSE_COLOR';
const CHANGE_UI = 'CHANGE_UI';

const chooseColor = (color) => ({
  type: CHOOSE_COLOR,
  payload: {
    color,
  },
});

const changeUI = (color) => ({
  type: CHANGE_UI,
  payload: {
    color,
  },
});
```

We want to test the saga:

```javascript
function* changeColorSaga() {
  const action = yield take(CHOOSE_COLOR);
  yield put(changeUI(action.payload.color));
}
```

Since Sagas always yield an Effect, and these effects have basic factory functions (e.g. put, take etc.) a test may
inspect the yielded effect and compare it to an expected effect. To get the first yielded value from a saga,
call its `next().value`:

```javascript
  const gen = changeColorSaga();

  assert.deepEqual(
    gen.next().value,
    take(CHOOSE_COLOR),
    'it should wait for a user to choose a color'
  );
```

A value must then be returned to assign to the `action` constant, which is used for the argument to the `put` effect:

```javascript
  const color = 'red';
  assert.deepEqual(
    gen.next(chooseColor(color)).value,
    put(changeUI(color)),
    'it should dispatch an action to change the ui'
  );
```

Since there are no more `yield`s, then next time `next()` is called, the generator will be done:

```javascript
  assert.deepEqual(
    gen.next().done,
    true,
    'it should be done'
  );
```

### Branching Saga

Sometimes your saga will have different outcomes. To test the different branches without repeating all the steps that lead to it you can use the utility function **cloneableGenerator**

This time we add two new actions, `CHOOSE_NUMBER` and `DO_STUFF`, with a related action creators:

```javascript
const CHOOSE_NUMBER = 'CHOOSE_NUMBER';
const DO_STUFF = 'DO_STUFF';

const chooseNumber = (number) => ({
  type: CHOOSE_NUMBER,
  payload: {
    number,
  },
});

const doStuff = () => ({
  type: DO_STUFF,
});
```

Now the saga under test will put two `DO_STUFF` actions before waiting for a `CHOOSE_NUMBER` action and then putting
either `changeUI('red')` or `changeUI('blue')`, depending on whether the number is even or odd.

```javascript
function* doStuffThenChangeColor() {
  yield put(doStuff());
  yield put(doStuff());
  const action = yield take(CHOOSE_NUMBER);
  if (action.payload.number % 2 === 0) {
    yield put(changeUI('red'));
  } else {
    yield put(changeUI('blue'));
  }
}
```

The test is as follows:

```javascript
import { put, take } from 'redux-saga/effects';
import { cloneableGenerator } from '@redux-saga/testing-utils';

test('doStuffThenChangeColor', assert => {
  const gen = cloneableGenerator(doStuffThenChangeColor)();
  gen.next(); // DO_STUFF
  gen.next(); // DO_STUFF
  gen.next(); // CHOOSE_NUMBER

  assert.test('user choose an even number', a => {
    // cloning the generator before sending data
    const clone = gen.clone();
    a.deepEqual(
      clone.next(chooseNumber(2)).value,
      put(changeUI('red')),
      'should change the color to red'
    );

    a.equal(
      clone.next().done,
      true,
      'it should be done'
    );

    a.end();
  });

  assert.test('user choose an odd number', a => {
    const clone = gen.clone();
    a.deepEqual(
      clone.next(chooseNumber(3)).value,
      put(changeUI('blue')),
      'should change the color to blue'
    );

    a.equal(
      clone.next().done,
      true,
      'it should be done'
    );

    a.end();
  });
});
```

See also: [Task cancellation](TaskCancellation.md) for testing fork effects

## Testing the full Saga

Although it may be useful to test each step of a saga, in practise this makes for brittle tests. Instead, it may be
preferable to run the whole saga and assert that the expected effects have occurred.

Suppose we have a basic saga which calls an HTTP API:

```javascript
function* callApi(url) {
  const someValue = yield select(somethingFromState);
  try {
    const result = yield call(myApi, url, someValue);
    yield put(success(result.json()));
    return result.status;
  } catch (e) {
    yield put(error(e));
    return -1;
  }
}
```

We can run the saga with mocked values:

```javascript
const dispatched = [];

const saga = runSaga({
  dispatch: (action) => dispatched.push(action),
  getState: () => ({ value: 'test' }),
}, callApi, 'http://url');
```

A test could then be written to assert the dispatched actions and mock calls:

```javascript
import sinon from 'sinon';
import * as api from './api';

test('callApi', async (assert) => {
  const dispatched = [];
  sinon.stub(api, 'myApi').callsFake(() => ({
    json: () => ({
      some: 'value'
    })
  }));
  const url = 'http://url';
  const result = await runSaga({
    dispatch: (action) => dispatched.push(action),
    getState: () => ({ state: 'test' }),
  }, callApi, url).toPromise();

  assert.true(myApi.calledWith(url, somethingFromState({ state: 'test' })));
  assert.deepEqual(dispatched, [success({ some: 'value' })]);
});
```

See also: Repository Examples:

https://github.com/redux-saga/redux-saga/blob/master/examples/counter/test/sagas.js

https://github.com/redux-saga/redux-saga/blob/master/examples/shopping-cart/test/sagas.js

## Testing libraries

While both of the above testing methods can be written natively, there exist several libraries to make both methods easier. Additionally, some libraries can be used to test sagas in a *third* way: recording specific side-effects (but not all).

Sam Hogarth's (@sh1989) [article](http://blog.scottlogic.com/2018/01/16/evaluating-redux-saga-test-libraries.html) summarizes the different options well.

For testing each generator yield step-by-step there is [`redux-saga-test`][1] and [`redux-saga-testing`][2]. [`redux-saga-test-engine`][3] is for recording and testing for specific side effects. For an integration test, [`redux-saga-tester`][4]. And [`redux-saga-test-plan`][5] can actually cover all three bases.

### `redux-saga-test` and `redux-saga-testing` for step-by-step testing

The `redux-saga-test` library provides syntactic sugar for your step-by-step tests. The `fromGenerator` function returns a value that can be iterated manually with `.next()` and have an assertion made using the relevant saga effect method.

```javascript
import fromGenerator from 'redux-saga-test';

test('with redux-saga-test', () => {
  const generator = callApi('url');
  /*
  * The assertions passed to fromGenerator
  * requires a `deepEqual` method
  */
  const expect = fromGenerator(assertions, generator);

  expect.next().select(somethingFromState);
  expect.next(selectedData).call(myApi, 'url', selectedData);
  expect.next(result).put(success(result.json));
});
```

`redux-saga-testing` library provides a method `sagaHelper` that takes your generator and returns a value that works a lot like Jest's `it()` function, but also advances the generator being tested. The `result` parameter passed into the callback is the value yielded by the generater

```javascript
import sagaHelper from 'redux-saga-testing';

test('with redux-saga-testing', () => {
  const it = sagaHelper(callApi());

  it('should select from state', selectResult => {
    // with Jest's `expect`
    expect(selectResult).toBe(value);
  });

  it('should select from state', apiResponse => {
    // without tape's `test`
    assert.deepEqual(apiResponse.json(), jsonResponse);
  });

  // an empty call to `it` can be used to skip an effect
  it('', () => {});
});
```

### `redux-saga-test-plan`

This is the most versatile library. The `testSaga` API is used for exact order testing and `expectSaga` is for both recording side-effects and integration testing.

```javascript
import { expectSaga, testSaga } from 'redux-saga-test-plan';

test('exact order with redux-saga-test-plan', () => {
  return testSaga(callApi, 'url')
    .next()
    .select(selectFromState)
    .next()
    .call(myApi, 'url', valueFromSelect);

    ...
});

test('recorded effects with redux-saga-test-plan', () => {
  /*
  * With expectSaga, you can assert that any yield from
  * your saga occurs as expected, *regardless of order*.
  * You must call .run() at the end.
  */
  return expectSaga(callApi, 'url')
    .put(success(value)) // last effect from our saga, first one tested

    .call(myApi, 'url', value)
    .run();
    /* notice no assertion for the select call */
});

test('test only final effect with .provide()', () => {
  /*
  * With the .provide() method from expectSaga
  * you can by pass in all expected values
  * and test only your saga's final effect.
  */
  return expectSaga(callApi, 'url')
    .provide([
      [select(selectFromState), selectedValue],
      [call(myApi, 'url', selectedValue), response]
    ])
    .put(success(response))
    .run();
});

test('integration test with withReducer', () => {
  /*
  * Using `withReducer` allows you to test
  * the state shape upon completion of your reducer -
  * a true integration test for your Redux store management.
  */

  return expectSaga(callApi, 'url')
    .withReducer(myReducer)
    .provide([
      [call(myApi, 'url', value), response]
    ])
    .hasFinalState({
      data: response
    })
    .run();
});
```


### redux-saga-test-engine

This library functions very similarly in setup to `redux-saga-test-plan`, but is best used to record effects. Provide a collection of saga generic effects to be watched by `createSagaTestEngine` function which in turn returns a function. Then provide your saga and specific effects and their arguments.

```javascript
const collectedEffects  = createSagaTestEngine(['SELECT', 'CALL', 'PUT']);
const actualEffects = collectEffects(mySaga, [ [myEffect(arg), value], ... ], argsToMySaga);
```

The value of `actualEffects` is an array containing elements equal to the yielded values from all *collected* effects, in order of occurence.

```javascript
import createSagaTestEngine from 'redux-saga-test-engine';

test('testing with redux-saga-test-engine', () => {
  const collectEffects = createSagaTestEngine(['CALL', 'PUT']);

  const actualEffects = collectEffects(
    callApi,
    [
      [select(selectFromState), selectedValue],
      [call(myApi, 'url', selectedValue), response]
    ],
    // Any further args are passed to the saga
    // Here it is our URL, but typically would be the dispatched action
    'url'
  );

  // assert that the effects you care about occurred as expected, in order
  assert.equal(actualEffects[0], call(myApi, 'url', selectedValue));
  assert.equal(actualEffects[1], put(success, response));

  // assert that your saga does nothing unexpected
  assert.true(actualEffects.length === 2);
});
```

### redux-saga-tester

A final library to consider for integration testing. this library provides a `sagaTester` class, to which you instantiate with your store's initial state and your reducer.

To test your saga, the `sagaTester` instance `start()` method with your saga and its argument(s). This runs your saga to its end. Then you may assert that effects occured, actions were dispatched and the state was updated as expected.

```javascript
import SagaTester from 'redux-saga-tester';

test('with redux-saga-tester', () => {
  const sagaTester = new SagaTester({
    initialState: defaultState,
    reducers: reducer
  });

  sagaTester.start(callApi);

  sagaTester.dispatch(actionToTriggerSaga());

  await sagaTester.waitFor(success);

  assert.true(sagaTester.wasCalled(success(response)));

  assert.deepEqual(sagaTester.getState(), { data: response });
});
```

## `effectMiddlwares`
Provides a native way to perform integration like testing without one of the above libraries.

The idea is that you can create a real redux store with saga middleware in your test file. The saga middlware takes an object as an argument. That object would have an `effectMiddlewares` value: a function where you can intercept/hijack any effect and resolve it on your own - passing it very redux-style to the next middleware.

In your test, you would start a saga, intercept/resolve async effects with effectMiddlewares and assert on things like state updates to test integration between your saga and a store.

Here's an example from the [docs](https://github.com/redux-saga/redux-saga/blob/34c9093684323ab92eacdf2df958f31d9873d3b1/test/interpreter/effectMiddlewares.js#L88):

```javascript
test('effectMiddleware', assert => {
  assert.plan(1);

  let actual = [];

  function rootReducer(state = {}, action) {
    return action;
  }

  const effectMiddleware = next => effect => {
    if (effect === apiCall) {
      Promise.resolve().then(() => next('injected value'));
      return;
    }
    return next(effect);
  };

  const middleware = sagaMiddleware({ effectMiddlewares: [effectMiddleware] });
  const store = createStore(rootReducer, {}, applyMiddleware(middleware));

  const apiCall = call(() => new Promise(() => {}));

  function* root() {
    actual.push(yield all([call(fnA), apiCall]));
  }

  function* fnA() {
    const result = [];
    result.push((yield take('ACTION-1')).val);
    result.push((yield take('ACTION-2')).val);
    return result;
  }

  const task = middleware.run(root)

  Promise.resolve()
    .then(() => store.dispatch({ type: 'ACTION-1', val: 1 }))
    .then(() => store.dispatch({ type: 'ACTION-2', val: 2 }));

  const expected = [[[1, 2], 'injected value']];

  task
    .toPromise()
    .then(() => {
      assert.deepEqual(
        actual,
        expected,
        'effectMiddleware must be able to intercept and resolve effect in a custom way',
      )
    })
    .catch(err => assert.fail(err));
});
```

 [1]: https://github.com/stoeffel/redux-saga-test
 [2]: https://github.com/antoinejaussoin/redux-saga-testing/
 [3]: https://github.com/DNAinfo/redux-saga-test-engine
 [4]: https://github.com/wix/redux-saga-tester
 [5]: https://github.com/jfairbank/redux-saga-test-plan
