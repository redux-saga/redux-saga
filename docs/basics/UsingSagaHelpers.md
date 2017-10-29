# Using Saga Helpers

`redux-saga` provides some helper effects wrapping internal functions to spawn tasks when some specific actions are dispatched to the Store.

The helper functions are built on top of the lower level API. In the advanced section, we'll see how those functions can be implemented.

The first function, `takeEvery` is the most familiar and provides a behavior similar to `redux-thunk`.

Let's illustrate with the common AJAX example. On each click on a Fetch button we dispatch a `FETCH_REQUESTED` action. We want to handle this action by launching a task that will fetch some data from the server.

First we create the task that will perform the asynchronous action:

```javascript
import { call, put } from 'redux-saga/effects'

export function* fetchData(action) {
   try {
      const data = yield call(Api.fetchUser, action.payload.url)
      yield put({type: "FETCH_SUCCEEDED", data})
   } catch (error) {
      yield put({type: "FETCH_FAILED", error})
   }
}
```

To launch the above task on each `FETCH_REQUESTED` action:

```javascript
import { takeEvery } from 'redux-saga/effects'

function* watchFetchData() {
  yield takeEvery('FETCH_REQUESTED', fetchData)
}
```

In the above example, `takeEvery` allows multiple `fetchData` instances to be started concurrently. At a given moment, we can start a new `fetchData` task while there are still one or more previous `fetchData` tasks which have not yet terminated.

If we want to only get the response of the latest request fired (e.g. to always display the latest version of data) we can use the `takeLatest` helper:

```javascript
import { takeLatest } from 'redux-saga/effects'

function* watchFetchData() {
  yield takeLatest('FETCH_REQUESTED', fetchData)
}
```

Unlike `takeEvery`, `takeLatest` allows only one `fetchData` task to run at any moment. And it will be the latest started task. If a previous task is still running when another `fetchData` task is started, the previous task will be automatically cancelled.

If you have multiple Sagas watching for different actions, you can create multiple watchers with those built-in helpers, which will behave like there was `fork` used to spawn them (we'll talk about `fork` later. For now, consider it to be an Effect that allows us to start multiple sagas in the background).

For example:

```javascript
import { takeEvery } from 'redux-saga/effects'

// FETCH_USERS
function* fetchUsers(action) { ... }

// CREATE_USER
function* createUser(action) { ... }

// use them in parallel
export default function* rootSaga() {
  yield takeEvery('FETCH_USERS', fetchUsers)
  yield takeEvery('CREATE_USER', createUser)
}
```
