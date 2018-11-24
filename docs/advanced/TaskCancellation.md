# Task cancellation

We saw already an example of cancellation in the [Non blocking calls](NonBlockingCalls.md) section. In this section we'll review cancellation in more detail.

Once a task is forked, you can abort its execution using `yield cancel(task)`.

To see how it works, let's consider a basic example: A background sync which can be started/stopped by some UI commands. Upon receiving a `START_BACKGROUND_SYNC` action, we fork a background task that will periodically sync some data from a remote server.

The task will execute continually until a `STOP_BACKGROUND_SYNC` action is triggered. Then we cancel the background task and wait again for the next `START_BACKGROUND_SYNC` action.

```javascript
import { take, put, call, fork, cancel, cancelled, delay } from 'redux-saga/effects'
import { someApi, actions } from 'somewhere'

function* bgSync() {
  try {
    while (true) {
      yield put(actions.requestStart())
      const result = yield call(someApi)
      yield put(actions.requestSuccess(result))
      yield delay(5000)
    }
  } finally {
    if (yield cancelled())
      yield put(actions.requestFailure('Sync cancelled!'))
  }
}

function* main() {
  while ( yield take(START_BACKGROUND_SYNC) ) {
    // starts the task in the background
    const bgSyncTask = yield fork(bgSync)

    // wait for the user stop action
    yield take(STOP_BACKGROUND_SYNC)
    // user clicked stop. cancel the background task
    // this will cause the forked bgSync task to jump into its finally block
    yield cancel(bgSyncTask)
  }
}
```

In the above example, cancellation of `bgSyncTask` will use [Generator.prototype.return](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) to make the Generator jump directly to the finally block. Here you can use `yield cancelled()` to check if the Generator has been cancelled or not.

Cancelling a running task will also cancel the current Effect where the task is blocked at the moment of cancellation.

For example, suppose that at a certain point in an application's lifetime, we have this pending call chain:

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
  yield call(someApi) // currently blocked on this call
  ...
}
```

`yield cancel(task)` triggers a cancellation on `subtask`, which in turn triggers a cancellation on `subtask2`.

So we saw that Cancellation propagates downward (in contrast returned values and uncaught errors propagates upward). You can see it as a *contract* between the caller (which invokes the async operation) and the callee (the invoked operation). The callee is responsible for performing the operation. If it has completed (either success or error) the outcome propagates up to its caller and eventually to the caller of the caller and so on. That is, callees are responsible for *completing the flow*.

Now if the callee is still pending and the caller decides to cancel the operation, it triggers a kind of a signal that propagates down to the callee (and possibly to any deep operations called by the callee itself). All deeply pending operations will be cancelled.

There is another direction where the cancellation propagates to as well: the joiners of a task (those blocked on a `yield join(task)`) will also be cancelled if the joined task is cancelled. Similarly, any potential callers of those joiners will be cancelled as well (because they are blocked on an operation that has been cancelled from outside).

## Testing generators with fork effect

When `fork` is called it starts the task in the background and also returns task object like we have learned previously. When testing this we have to use utility function `createMockTask`. Object returned from this function should be passed to next `next` call after fork test. Mock task can then be passed to `cancel` for example. Here is test for `main` generator which is on top of this page.

```javascript
import { createMockTask } from '@redux-saga/testing-utils';

describe('main', () => {
  const generator = main();

  it('waits for start action', () => {
    const expectedYield = take(START_BACKGROUND_SYNC);
    expect(generator.next().value).to.deep.equal(expectedYield);
  });

  it('forks the service', () => {
    const expectedYield = fork(bgSync);
    const mockedAction = { type: 'START_BACKGROUND_SYNC' };
    expect(generator.next(mockedAction).value).to.deep.equal(expectedYield);
  });

  it('waits for stop action and then cancels the service', () => {
    const mockTask = createMockTask();

    const expectedTakeYield = take(STOP_BACKGROUND_SYNC);
    expect(generator.next(mockTask).value).to.deep.equal(expectedTakeYield);

    const expectedCancelYield = cancel(mockTask);
    expect(generator.next().value).to.deep.equal(expectedCancelYield);
  });
});
```

You can also use mock task's functions `setRunning`, `setResult` and `setError` to set mock task's state. For example `mockTask.setRunning(false)`.

### Note

It's important to remember that `yield cancel(task)` doesn't wait for the cancelled task to finish (i.e. to perform its finally block). The cancel effect behaves like fork. It returns as soon as the cancel was initiated. Once cancelled, a task should normally return as soon as it finishes its cleanup logic.

## Automatic cancellation

Besides manual cancellation there are cases where cancellation is triggered automatically

1. In a `race` effect. All race competitors, except the winner, are automatically cancelled.

2. In a parallel effect (`yield all([...])`). The parallel effect is rejected as soon as one of the sub-effects is rejected (as implied by `Promise.all`). In this case, all the other sub-effects are automatically cancelled.
