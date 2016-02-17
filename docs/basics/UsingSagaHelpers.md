# Using Saga Helpers

redux-saga provides some helper functions to spawn tasks when some specific actions are
dispatched to the Store.

The helper functions are built on top of the lower level API. In the advanced section,
we'll see how those functions can be implemented.

The first function, `takeEvery` is the most familiar and provides a behavior similar to
redux-thunk.

Let's illustrate with the common AJAX example. On each click on a Fetch button
we dispatch a `FETCH_REQUESTED` action. We want to handle this action by launching
a task that will fetch some data from the server.

First we create the task that will perform the asynchronous action

```javascript
import { call, put } from 'redux-saga/effects'

export function* fetchData(action) {
   try {
      const data = yield call(Api.fetchUser, action.payload.url);
      yield put({type: "FETCH_SUCCEEDED", data});
   } catch (error) {
      yield put({type: "FETCH_FAILED", error});
   }
}
```

To launch the above task on each `FETCH_REQUESTED` action

```javascript
import { takeEvery } from 'redux-saga'

function* watchFetchData() {
  yield* takeEvery('FETCH_REQUESTED', fetchData)
}
```

In the above example, `takeEvery` allows multiple `fetchData` instances to be started
concurrently. At a given moment, we can start a new `fetchData` task while there are
still one or more previous `fetchData` which have not yet terminated.

If we want a behavior where we want only to get the response of the latest request fired
(e.g. to display always the latest version of data). We can use the `takeLatest`
helper.


```javascript
import { takeLatest } from 'redux-saga'

function* watchFetchData() {
  yield* takeLatest('FETCH_REQUESTED', fetchData)
}
```

Unlike `takeEvery`, `takeLatest` allows only one `fetchData` task to run at any moment. And it's
the latest started task. In the case of a previous task is still running, it'll be automatically
cancelled.
