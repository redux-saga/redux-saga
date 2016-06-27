# Recipes

## Throttling

You can throttle a sequence of dispatched actions by putting a delay inside a watcher Saga. For example, suppose the UI fires an `INPUT_CHANGED` action while the user is typing in a text field.

```javascript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* handleInput(input) {
  // ...
}

function* watchInput() {
  while (true) {
    const { input } = yield take('INPUT_CHANGED')
    yield fork(handleInput, input)
    // throttle by 500ms
    yield call(delay, 500)
  }
}
```

By putting a delay after the `fork`, the `watchInput` will be blocked for 500ms so it'll miss all `INPUT_CHANGED` actions happening in-between. This ensures that the Saga will take at most one `INPUT_CHANGED` action during each period of 500ms.

But there is a subtle issue with the above code. After taking an action, `watchInput` will sleep for 500ms, which means it'll miss all actions that occurred in this period. That may be the purpose for throttling, but note the watcher will also miss the trailer action: i.e. the last action that may eventually occur in the 500ms interval. If you are throttling input actions on a text field, this may be undesirable, because you'll likely want to react to the last input after the 500ms throttling delay has passed.

Here is a more elaborate version which keeps track of the trailing action:

```javascript
function* watchInput(wait) {
  let lastAction
  let lastTime = Date.now()
  let countDown = 0 // handle leading action

  while (true) {
    const winner = yield race({
      action: take('INPUT_CHANGED'),
      timeout: countDown ? call(delay, countDown) : null
    })
    const now = Date.now()
    countDown -= (now - lastTime)
    lastTime = now

    if (winner.action) {
      lastAction = action
    }
    if (lastAction && countDown <= 0) {
      yield fork(worker, lastAction)
      lastAction = null
      countDown = wait
    }
  }
}
```

In the new version, we maintain a `countDown` variable which tracks the remaining timeout. Initially the `countDown` is `0` because we want to handle the first action. After handling the first action, the `countDown` will be set to the throttling period `wait`. Which means we'll have to wait at least for `wait` ms before handling a next action.

Then at each iteration, we start a race between the next eventual action and the remaining timeout. Now we don't miss any action, instead we keep track of the last one in the `lastAction` variable, and we also update the countDown with remaining timeout.

The `if (lastAction && countDown <= 0) {...}` block ensures that we can handle an eventual trailing action (if `lastAction` is not null/undefined) after the throttling period expired (if `countDown` is less or equal than 0). Immediately after handling the action, we reset the `lastAction` and `countDown`. So we'll now have to wait for another `wait` ms period for another action to handle it.

## Debouncing

To debounce a sequence, put the `delay` in the forked task:

```javascript

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* handleInput(input) {
  // debounce by 500ms
  yield call(delay, 500)
  ...
}

function* watchInput() {
  let task
  while (true) {
    const { input } = yield take('INPUT_CHANGED')
    if (task) {
      yield cancel(task)
    }
    task = yield fork(handleInput, input)
  }
}
```

In the above example `handleInput` waits for 500ms before performing its logic. If the user types something during this period we'll get more `INPUT_CHANGED` actions. Since `handleInput` will still be blocked in the `delay` call, it'll be cancelled by `watchInput` before it can start performing its logic.

Example above could be rewritten with redux-saga `takeLatest` helper:

```javascript

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function* handleInput({ input }) {
  // debounce by 500ms
  yield call(delay, 500)
  ...
}

function* watchInput() {
  // will cancel current running handleInput task
  yield* takeLatest('INPUT_CHANGED', handleInput);
}
```
