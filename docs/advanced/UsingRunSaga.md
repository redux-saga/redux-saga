# Connecting Sagas to external Input/Output

We saw that `take` Effects are resolved by waiting for actions to be dispatched to the Store. And that `put` Effects are resolved by dispatching the actions provided as argument.

When a Saga is started (either at startup or later dynamically), the middleware automatically connects its `take`/`put` to the store. The 2 Effects can be seen as a sort of Input/Output to the Saga.

`redux-saga` provides a way to run a Saga outside of the Redux middleware environment and connect it to a custom Input/Output.

```javascript
import { runSaga } from 'redux-saga'

function* saga() { ... }

const myIO = {
  subscribe: ..., // this will be used to resolve take Effects
  dispatch: ...,  // this will be used to resolve put Effects
  getState: ...,  // this will be used to resolve select Effects
}

runSaga(
  saga(),
  myIO
)
```

For more info, see the [API docs](http://yelouafi.github.io/redux-saga/docs/api/index.html#runsagaiterator-options).
