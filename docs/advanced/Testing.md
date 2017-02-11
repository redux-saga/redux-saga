# Testing Sagas
There is ongoing discussion in [this issue](https://github.com/redux-saga/redux-saga/issues/518) about the best way to test Sagas, below we've explained in some detail the two different approaches to testing Sagas. We recommend reading the issue linked above to decide for yourself how you want to test your Sagas. It's important to make clear these are not mutually exclusive and can be used together.

## The unit test approach
This involves a lot of duplication and often results in breaking tests even with the smallest of changes to the Saga that's being tested.

To illustrate, this is a saga from one of our example projects

```
export function* incrementAsync() {
  yield call(delay, 1000)
  yield put({type: 'INCREMENT'})
}
```

Which can be tested in this way

```
import test from 'tape';

import { put, call } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import { incrementAsync } from './sagas/counter-saga'

test('incrementAsync Saga test', (t) => {
  const generator = incrementAsync()

  t.deepEqual(
    generator.next().value,
    call(delay, 1000),
    'counter Saga must call delay(1000)'
  )

  t.deepEqual(
    generator.next().value,
    put({type: 'INCREMENT'}),
    'counter Saga must dispatch an INCREMENT action'
  )

  t.deepEqual(
    generator.next(),
    { done: true, value: undefined },
    'counter Saga must be done'
  )
}
```
If, for instance you swapped the order of the call and put in the saga, the tests would fail, the result in this example is you're only really testing that the Saga executed in order. Some have come to the conclusion that unit testing sagas offers no benefit which is why integrated testing can be a more valueable approach. However if your Sagas contain branches or races there can be value in asserting that the Saga performs as expected given a certain state.


## The integrated test approach
This approach involves mocking a Store creating Spies and focuses more on the effects of the Saga not it's internals. 

It follows these 3 steps:

1. Set up a test store with a specific scenario. Test store includes a reducer that interacts with actions that are fired by the saga.
2. Run the saga using the standard redux-saga framework.
3. Test the side effects (actions that were sent).

If that sounds like a lot of work, luckily there's a library for that, [redux-saga-test-plan](https://github.com/jfairbank/redux-saga-test-plan) makes integration testing of Sagas a lot simpler and handles the relationship between Store, Action, Reducer and Saga and results in concise tests.


## The future of testing Sagas
Once v1 of Sagas has been shipped, one of the focuses will be on understanding user's requirements for testing and making sure the library is flexible enough to support both approaches to testing.


For now you can also read through the two examples of testing Sagas in the repo, these both use the unit testing approach:

1. https://github.com/redux-saga/redux-saga/blob/master/examples/counter/test/sagas.js
2. https://github.com/redux-saga/redux-saga/blob/master/examples/shopping-cart/test/sagas.js
