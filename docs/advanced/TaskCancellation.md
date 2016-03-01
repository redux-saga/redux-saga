# Task cancellation

We saw already an example of cancellation in the [Non blocking calls](#NonBlockingCalls.md) section. In this
section we'll review in some more details the semantics of cancellation.

Once a task is forked, you can abort its execution using `yield cancel(task)`. Cancelling a running task will throw a `SagaCancellationException` inside it.

To see how it works, let's consider a simple example. A background sync which can be started/stopped by some UI commands. Upon receiving a `START_BACKGROUND_SYNC` action, we fork a background task that will periodically sync some data from a remote server.

The task will execute continually until a `STOP_BACKGROUND_SYNC` action is triggered. Then we cancel the background task and wait again for the next `START_BACKGROUND_SYNC` action.   

```javascript
import { SagaCancellationException } from 'redux-saga'
import {  take, put, call, fork, cancel } from 'redux-saga/effects'
import actions from 'somewhere'
import { someApi, delay } from 'somewhere'

function* bgSync() {
  try {
    while(true) {
      yield put(actions.requestStart())
      const result = yield call(someApi)
      yield put(actions.requestSuccess(result))
      yield call(delay, 5000)
    }
  } catch(error) {
    // or simply using `isCancelError(error)`
    if(error instanceof SagaCancellationException)
      yield put(actions.requestFailure('Sync cancelled!'))
  }
}

function* main() {
  while( yield take(START_BACKGROUND_SYNC) ) {
    // starts the task in the background
    const bgSyncTask = yield fork(bgSync)

    // wait for the user stop action
    yield take(STOP_BACKGROUND_SYNC)
    // user clicked stop. cancel the background task
    // this will throw a SagaCancellationException into the forked bgSync task
    yield cancel(bgSyncTask)
  }
}
```

`yield cancel(bgSyncTask)` will throw a `SagaCancellationException`
inside the currently running task. In the above example, the exception is caught by `bgSync`. **Note that uncaught `SagaCancellationException` are not bubbled upward**. In the above example, if `bgSync` doesn't catch the cancellation error, the error will not propagate to `main` (because `main` has already moved on).

Cancelling a running task will also cancel the current effect where the task is blocked at the moment of cancellation.

For example, suppose that at a certain point in an application's lifetime, we had this pending call chain:

```javascript
function* main() {
  const task = yield fork(subtask)
  ...
  // later
  yield cancel(task)
}

function* subtask() {
  ...
  yield call(subtask2) // currently blocked on this call
  ...
}

function* subtask2() {
  ...
  yield call(someApi) // currently blocked on this all
  ...
}
```

`yield cancel(task)` will trigger a cancellation on `subtask`, which in turn will trigger a cancellation on `subtask2`. A `SagaCancellationException` will be thrown inside `subtask2`, then another `SagaCancellationException` will be thrown inside `subtask`. If `subtask` omits to handle the cancellation exception, a warning message is printed to the console to warn the developer (the message is only printed if there is a `process.env.NODE_ENV` variable
set and it's set to `'development'`).

The main purpose of the cancellation exception is to allow cancelled tasks to perform any cleanup logic, so we wont leave the application in an inconsistent state. In the above example of background sync, by catching the cancellation exception, `bgSync` is able to dispatch a `requestFailure` action to the store. Otherwise, the store could be left in a inconsistent state (e.g. waiting for the result of a pending request).

### Note

It's important to remember that `yield cancel(task)` doesn't wait for the cancelled task to finish (i.e. to perform its catch block). The cancel effect behaves like fork. It returns as soon as the cancel was initiated.
Once cancelled, a task should normally return as soon as it finishes its cleanup logic.
In some cases, the cleanup logic could involve some async operations, but the cancelled task lives now as a separate process, and there is no way for it to rejoin the main control flow (except dispatching actions for other tasks via the Redux store. However this will lead to complicated control flows that are hard to reason about. It's always preferable to terminate a cancelled task ASAP).

## Automatic cancellation

Besides manual cancellation there are cases where cancellation is triggered automatically

1. In a `race` effect. All race competitors, except the winner, are automatically cancelled.

2. In a parallel effect (`yield [...]`). The parallel effect is rejected as soon as one of the sub-effects is rejected (as implied by `Promise.all`). In this case, all the other sub-effects are automatically cancelled.
