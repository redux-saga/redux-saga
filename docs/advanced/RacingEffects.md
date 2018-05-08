## Starting a race between multiple Effects

Sometimes we start multiple tasks in parallel but we don't want to wait for all of them, we just need
to get the *winner*: the first one that resolves (or rejects). The `race` Effect offers a way of
triggering a race between multiple Effects.

The following sample shows a task that triggers a remote fetch request, and constrains the response within a
1 second timeout.

```javascript
import { race, call, put, delay } from 'redux-saga/effects'

function* fetchPostsWithTimeout() {
  const {posts, timeout} = yield race({
    posts: call(fetchApi, '/posts'),
    timeout: delay(1000)
  })

  if (posts)
    yield put({type: 'POSTS_RECEIVED', posts})
  else
    yield put({type: 'TIMEOUT_ERROR'})
}
```

Another useful feature of `race` is that it automatically cancels the loser Effects. For example,
suppose we have 2 UI buttons:

- The first starts a task in the background that runs in an endless loop `while (true)`
(e.g. syncing some data with the server each x seconds).

- Once the background task is started, we enable a second button which will cancel the task


```javascript
import { race, take, call } from 'redux-saga/effects'

function* backgroundTask() {
  while (true) { ... }
}

function* watchStartBackgroundTask() {
  while (true) {
    yield take('START_BACKGROUND_TASK')
    yield race({
      task: call(backgroundTask),
      cancel: take('CANCEL_TASK')
    })
  }
}
```

In the case a `CANCEL_TASK` action is dispatched, the `race` Effect will automatically cancel
`backgroundTask` by throwing a cancellation error inside it.
