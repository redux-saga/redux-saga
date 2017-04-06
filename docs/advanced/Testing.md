# Testing Sagas

**Effects return plain javascript objects**

Those objects describe the effect and redux-saga is in charge to execute them.

This makes testing very easy because all you have to do is compare that the object yielded by the saga describe the effect you want.
 
## Basic Example

```javascript
console.log(put({ type: MY_CRAZY_ACTION }));

/*
{
  @@redux-saga/IO': true,
  PUT: {
    channel: null,
    action: {
      type: 'MY_CRAZY_ACTION'
    }
  }
}
 */
```

Testing a saga that wait for a user action and dispatch

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


function* changeColorSaga() {
  const action = yield take(CHOOSE_COLOR);
  yield put(changeUI(action.payload.color));
}

test('change color saga', assert => {
  const gen = changeColorSaga();

  assert.deepEqual(
    gen.next().value,
    take(CHOOSE_COLOR),
    'it should wait for a user to choose a color'
  );

  const color = 'red';
  assert.deepEqual(
    gen.next(chooseColor(color)).value,
    put(changeUI(color)),
    'it should dispatch an action to change the ui'
  );

  assert.deepEqual(
    gen.next().done,
    true,
    'it should be done'
  );

  assert.end();
});
```

Another great benefit is that your tests are also your doc! They describe everything that should happen.

## Branching Saga 

Sometimes your saga will have different outcomes. To test the different branches without repeating all the steps that lead to it you can use the utility function **cloneableGenerator**
```javascript
const CHOOSE_NUMBER = 'CHOOSE_NUMBER';
const CHANGE_UI = 'CHANGE_UI';
const DO_STUFF = 'DO_STUFF';

const chooseNumber = (number) => ({
  type: CHOOSE_NUMBER,
  payload: {
    number,
  },
});

const changeUI = (color) => ({
  type: CHANGE_UI,
  payload: {
    color,
  },
});

const doStuff = () => ({
  type: DO_STUFF, 
});


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

import { put, take } from 'redux-saga/effects';
import { cloneableGenerator } from 'redux-saga/utils';

test('doStuffThenChangeColor', assert => {
  const data = {};
  data.gen = cloneableGenerator(doStuffThenChangeColor)();

  assert.deepEqual(
    data.gen.next().value,
    put(doStuff()),
    'it should do stuff'
  );

  assert.deepEqual(
    data.gen.next().value,
    put(doStuff()),
    'it should do stuff'
  );

  assert.deepEqual(
    data.gen.next().value,
    take(CHOOSE_NUMBER),
    'should wait for the user to give a number'
  );

  assert.test('user choose an even number', a => {
    // cloning the generator before sending data
    data.clone = data.gen.clone();
    a.deepEqual(
      data.gen.next(chooseNumber(2)).value,
      put(changeUI('red')),
      'should change the color to red'
    );

    a.equal(
      data.gen.next().done,
      true,
      'it should be done'
    );

    a.end();
  });

  assert.test('user choose an odd number', a => {
    a.deepEqual(
      data.clone.next(chooseNumber(3)).value,
      put(changeUI('blue')),
      'should change the color to blue'
    );

    a.equal(
      data.clone.next().done,
      true,
      'it should be done'
    );

    a.end();
  });
});
```

See also: [Task cancellation](TaskCancellation.md) for testing fork effects

See also: Repository Examples:

https://github.com/redux-saga/redux-saga/blob/master/examples/counter/test/sagas.js

https://github.com/redux-saga/redux-saga/blob/master/examples/shopping-cart/test/sagas.js
