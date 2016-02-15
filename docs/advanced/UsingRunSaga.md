# Connecting Sagas to external Input/Output

We saw hat `take` Effects are resolved by waiting for actions to be dispatched to the Store.
And that `put` Effects are resolved by dispatching the actions provided as argument.

When a Saga is started (either at startup or later dynamically), the middleware automatically
connects its `take`/`put` to the store. The 2 Effects can be seen as a sort of Input/Output to
the Saga.

**WIP**

For now see [API docs](http://yelouafi.github.io/redux-saga/docs/api/index.html#runsagagenerator-subscribe-dispatch-monitor)
