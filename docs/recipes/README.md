# Recipes

## Throttling

You can throttle a sequence of dispatched actions by using a handy built-in `throttle` helper. For example, suppose the UI fires an `INPUT_CHANGED` action while the user is typing in a text field.

```javascript
import { throttle } from 'redux-saga/effects'

function* handleInput(input) {
  // ...
}

function* watchInput() {
  yield throttle(500, 'INPUT_CHANGED', handleInput)
}
```

By using this helper the `watchInput` won't start a new `handleInput` task for 500ms, but in the same time it will still be accepting the latest `INPUT_CHANGED` actions into its underlaying `buffer`, so it'll miss all `INPUT_CHANGED` actions happening in-between. This ensures that the Saga will take at most one `INPUT_CHANGED` action during each period of 500ms and still be able to process trailing action.

## Debouncing
From redux-saga@v1 [debounce](../api/README.md#debouncems-pattern-saga-args) is built-in effect.

Let's consider how the effect could be implemented as a combination of other base effects.

To debounce a sequence, put the built-in `delay` helper in the forked task:

```javascript

import { call, cancel, fork, take, delay } from 'redux-saga/effects'

function* handleInput(input) {
  // debounce by 500ms
  yield delay(500)
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

import { call, takeLatest, delay } from 'redux-saga/effects'

function* handleInput({ input }) {
  // debounce by 500ms
  yield delay(500)
  ...
}

function* watchInput() {
  // will cancel current running handleInput task
  yield takeLatest('INPUT_CHANGED', handleInput);
}
```

## Retrying XHR calls
From redux-saga@v1 [retry](../api/README.md#retrymaxtries-delay-fn-args) is built-in effect.

Let's consider how the effect could be implemented as a combination of other base effects.

To retry an XHR call for a specific amount of times, use a for loop with a delay:

```javascript

import { call, put, take, delay } from 'redux-saga/effects'

function* updateApi(data) {
  for(let i = 0; i < 5; i++) {
    try {
      const apiResponse = yield call(apiRequest, { data });
      return apiResponse;
    } catch(err) {
      if(i < 4) {
        yield delay(2000);
      }
    }
  }
  // attempts failed after 5 attempts
  throw new Error('API request failed');
}

export default function* updateResource() {
  while (true) {
    const { data } = yield take('UPDATE_START');
    try {
      const apiResponse = yield call(updateApi, data);
      yield put({
        type: 'UPDATE_SUCCESS',
        payload: apiResponse.body,
      });
    } catch (error) {
      yield put({
        type: 'UPDATE_ERROR',
        error
      });
    }
  }
}

```

In the above example the `apiRequest` will be retried for 5 times, with a delay of 2 seconds in between. After the 5th failure, the exception thrown will get caught by the parent saga, which will dispatch the `UPDATE_ERROR` action.

If you want unlimited retries, then the `for` loop can be replaced with a `while (true)`. Also instead of `take` you can use `takeLatest`, so only the last request will be retried. By adding an `UPDATE_RETRY` action in the error handling, we can inform the user that the update was not successful but it will be retried.

```javascript
import { delay } from 'redux-saga/effects'

function* updateApi(data) {
  while (true) {
    try {
      const apiResponse = yield call(apiRequest, { data });
      return apiResponse;
    } catch(error) {
      yield put({
        type: 'UPDATE_RETRY',
        error
      })
      yield delay(2000);
    }
  }
}

function* updateResource({ data }) {
  const apiResponse = yield call(updateApi, data);
  yield put({
    type: 'UPDATE_SUCCESS',
    payload: apiResponse.body,
  });
}

export function* watchUpdateResource() {
  yield takeLatest('UPDATE_START', updateResource);
}

```

## Undo

The ability to undo respects the user by allowing the action to happen smoothly
first and foremost before assuming they don't know what they are doing. [GoodUI](https://goodui.org/#8)
The [redux documentation](http://redux.js.org/docs/recipes/ImplementingUndoHistory.html) describes a
robust way to implement an undo based on modifying the reducer to contain `past`, `present`,
and `future` state.  There is even a library [redux-undo](https://github.com/omnidan/redux-undo) that
creates a higher order reducer to do most of the heavy lifting for the developer.

However, this method comes with overhead because it stores references to the previous state(s) of the application.

Using redux-saga's `delay` and `race` we can implement a basic, one-time undo without enhancing
our reducer or storing the previous state.

```javascript
import { take, put, call, spawn, race, delay } from 'redux-saga/effects'
import { updateThreadApi, actions } from 'somewhere'

function* onArchive(action) {

  const { threadId } = action
  const undoId = `UNDO_ARCHIVE_${threadId}`

  const thread = { id: threadId, archived: true }

  // show undo UI element, and provide a key to communicate
  yield put(actions.showUndo(undoId))

  // optimistically mark the thread as `archived`
  yield put(actions.updateThread(thread))

  // allow the user 5 seconds to perform undo.
  // after 5 seconds, 'archive' will be the winner of the race-condition
  const { undo, archive } = yield race({
    undo: take(action => action.type === 'UNDO' && action.undoId === undoId),
    archive: delay(5000)
  })

  // hide undo UI element, the race condition has an answer
  yield put(actions.hideUndo(undoId))

  if (undo) {
    // revert thread to previous state
    yield put(actions.updateThread({ id: threadId, archived: false }))
  } else if (archive) {
    // make the API call to apply the changes remotely
    yield call(updateThreadApi, thread)
  }
}

function* main() {
  while (true) {
    // wait for an ARCHIVE_THREAD to happen
    const action = yield take('ARCHIVE_THREAD')
    // use spawn to execute onArchive in a non-blocking fashion, which also
    // prevents cancellation when main saga gets cancelled.
    // This helps us in keeping state in sync between server and client
    yield spawn(onArchive, action)
  }
}
```
