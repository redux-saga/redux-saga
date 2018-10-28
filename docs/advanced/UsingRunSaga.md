# Connecting Sagas to external Input/Output

We saw that `take` Effects are resolved by waiting for actions to be dispatched to the Store. And that `put` Effects are resolved by dispatching the actions provided as argument.

When a Saga is started (either at startup or later dynamically), the middleware automatically connects its `take`/`put` to the store. The 2 Effects can be seen as a sort of Input/Output to the Saga.

`redux-saga` provides a way to run a Saga outside of the Redux middleware environment and connect it to a custom Input/Output.

```js
import { runSaga, stdChannel } from 'redux-saga'

const emitter = new EventEmitter()
const channel = stdChannel()
emitter.on("action", channel.put)

const myIO = {
  // this will be used to orchestrate take and put Effects
  channel,
  // this will be used to resolve put Effects
  dispatch(output) {
    emitter.emit("action", output)
  },
  // this will be used to resolve select Effects
  getState() {
    return state
  }
}

runSaga(
  myIO,
  function* saga() { ... },
)
```

For more info, see the [API docs](https://redux-saga.js.org/docs/api/index.html##runsagaoptions-saga-args), [Channels](./Channels.md), [demo](https://codesandbox.io/s/1yq1lx77jq)
