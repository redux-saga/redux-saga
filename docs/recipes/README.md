## Recipes

### Throttling

You can throttle a sequence of dispatched actions by putting a delay inside a watcher Saga.
For example suppose the UI fires an `INPUT_CHANGED` action while the user is typing in a text
field.

```javascript

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* handleInput(input) {
  ...
}

function* watchInput() {
  while(true) {
    const { input } = yield take('INPUT_CHANGED')
    yield fork(handleInput, input)
    // throttle by 500ms
    yield call(delay, 500)
  }
}
```

By putting a delay after the `fork`, the `watchInput` will be blocked for 500ms so it'll miss
all `INPUT_CHANGED` actions happening in-between. This ensures that the Saga will take at most
one `INPUT_CHANGED` action during each period of 500ms.

### Debouncing

To debounce the sequence you put the `delay` in the forked task

```javascript

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* handleInput(input) {
  // debounce by 500ms
  yield call(delay, 500)
  ...
}

function* watchInput() {
  let task
  while(true) {
    const { input } = yield take('INPUT_CHANGED')
    if(task)
      yield cancel(task)
    task = yield fork(handleInput, input)
  }
}
```

In the above example `handleInput` waits for 500ms before performing its logic. If the user
types something during this period we'll get more `INPUT_CHANGED` actions. Since `handleInput`
will still be blocked in the `delay` call, it'll be cancelled by `watchInput` before it can start
performing its logic
