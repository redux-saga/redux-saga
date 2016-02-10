# Pulling future actions

For demo purposes, let's take a simple case. The UI displays some form inputs to the user
in order to enter some data (e.g. name, email, address ... whatever). A `Save` button is
provided which allows the user to trigger a POST request which will save the entered data
in a remote server. For simplicity purpose, we won't allow concurrent saves. i.e Once a
save is triggered, the user has to wait for it to terminate before firing another save.

Here is a simplified example on a Saga that handles a `SAVE_DATA` action

```javascript
import api from './path/to/api'
import { take } from 'redux-saga'

function* watchSave() {
  while(true) {
    const { data } = yield take('SAVE_DATA')
    yield api.save(data)
  }
}
```

The call `yield take('SAVE_DATA')` is a typical illustration of how Sagas work.

Typically, actual middlewares handle some Effect form triggered by an Action Creator. For example,
redux-thunk handles *thunks* by calling them with `(getState, dispatch)` as arguments,
redux-promise handles Promises by dispatching their resolved values, and redux-gen handles generators by
dispatching all yielded actions to the store. The common thing that all those middlewares share is the
same 'call on each action' pattern. They will be called again and again each time an action happens,
i.e. they are *scoped* by the *root action* that triggered them.

Sagas work differently, they are not fired from within Action Creators but are started with your
application and choose what user actions to watch. They are like daemon tasks that run in
the background and choose their own logic of progression. In the example above, `watchSave` *pulls*
the `SAVE_DATA` action using `yield take(...)`. This is a *blocking call*, which means the Saga
will not progress until it receives a matching action.
