# Non blocking calls

In the previous section, we saw how the `take` Effect allows us to better describe a non
trivial flow in a central place.

Revisiting the login flow example

```javascript
function* loginFlow() {
  while(true) {
    yield take('LOGIN')
    // ... perform the login logic
    yield take('LOGOUT')
    // ... perform the logout logic
  }
}
```

Let's complete the example and implement the actual login/logout logic. We'll suppose that we have
an Api which permits us to authorize the user on a remote server. If the authorization is successful
the server will return an authorization token which will be stored by our application using the
DOM storage (we'll suppose our Api provide another service for DOM storage).

When the user logout, we'll simply delete the authorization token stored previously.

### First try

So far we have all needed Effects in order to implement the above flow. We can wait for specific
actions in the store using the `take` Effect. We can make asynchronous calls using the `call` Effect
and finally we can dispatch actions to the store using the `put` Effect.

So let's give it a try

>Note the below code has a subtle issue ,make sure to read the section until the end

```javascript
import { take, call, put } from 'redux-saga/effects'
import Api from '...'

function* authorize(user, password) {
  try {
    const token = yield call(Api.authorize, user, password)
    yield put({type: 'LOGIN_SUCCESS', token})
    return token
  } catch(error) {
    yield put({type: 'LOGIN_ERROR', error})
  }
}

function* loginFlow() {
  while(true) {
    const {user, password} = yield take('LOGIN_REQUEST')
    const token = yield call(authorize, user, password)
    if(token) {
      yield call(Api.storeItem({token}))
      yield take('LOGOUT')
      yield call(Api.clearItem('token'))
    }
  }
}
```

First we created a separate Generator `authorize` which will perform the actual Api call and
notify the Store upon success.

The `loginFlow` implements its entire flow inside a `while(true)` loop, which means once
we reach the last step in the flow (`LOGOUT`) we start a new iteration by waiting for a
new `LOGIN_REQUEST` action.

`loginFlow` first wait for a `LOGIN_REQUEST` action. Then retrieves the credentials in the
action payload (`user` and `password`) and makes a `call` to the `authorize` task.

As you noted, `call` isn't only for invoking functions returning Promises. We can also use it to
invoke other Generator functions. In the above example, **`loginFlow` will wait for authorize
until it terminates and returns** (i.e. after performing the api call, dispatching the action and then
returning the token to `loginFlow`).

If the Api call succeeds, `authorize` will dispatch a `LOGIN_SUCCESS` action then returns the
fetched token. If it results in an error,  it'll dispatch a `LOGIN_ERROR` action.

If the call to `authorize` is successful, `loginFlow` will store the returned token
in the DOM storage and wait for a `LOGOUT` action. When the user logouts, we remove the
stored token and wait for a new user login.

In the case of `authorize` failed, it'll return an undefined value, which will cause `loginFlow`
to skip the pervious process and wait for a new `LOGIN_REQUEST` action.

Observe how the entire logic is stored in one place. A new developer reading our code
doesn't have to travel between various places in order to understand the
control flow. It's like reading a synchronous algorithm: steps are layed out in their
natural order. And we have functions which call other functions and wait for their results.

### But there is still a subtle issue with the above approach

Suppose that when the `loginFlow` is waiting for the following call to resolve

```javascript
function* loginFlow() {
  while(true) {
    ...
    try {
      const token = yield call(authorize, user, password)
      ...
    }
    ...
  }
}
```

The user clicks on the `Logout` button causing a `LOGOUT` action to be dispatched

The following example illustrates the hypothetical sequence of the events :

```
UI                              loginFlow
--------------------------------------------------------
LOGIN_REQUEST...................call authorize.......... waiting to resolve
........................................................
........................................................                     
LOGOUT.................................................. missed!
........................................................
................................authorize returned...... dispatch a `LOGIN_SUCCESS`!!
........................................................
```

When `loginFlow` is blocked on the `authorize` call, an eventual `LOGOUT` occurring in
between the call and the response will be missed, because `loginFlow` hasn't yet performed
the `yield take('LOGOUT')`.

The problem with the above code is that `call` is a blocking Effect. i.e. the Generator
can't perform/handle anything else until the call terminates. But in our case we do not only
want `loginFlow` to execute the authorization call, but also watch for an eventual `LOGOUT`
action that may occur in the middle of this call. That's because `LOGOUT` is *concurrent*
to the `authorize` call.

So what's needed is some way to start `authorize` without blocking. So `loginFlow` can continue
and watch for an eventual/concurrent `LOGOUT` action.


To express non-blocking calls, the library provides another Effect: [`fork`](http://yelouafi.github.io/redux-saga/docs/api/index.html#forkfn-args). When we fork
a *task*, the task is started in the background and the caller can continue its flow without
waiting for the forked task to terminate.

So in order for `loginFlow` to not miss a concurrent `LOGOUT`, we must not `call` the `authorize`
task, instead we have to `fork` it.

```javascript
import { fork, call, take, put } from 'redux-saga/effects'

function* loginFlow() {
  while(true) {
    ...
    try {
      // non blocking call, what's the returned value here ?
      const ?? = yield fork(authorize, user, password)
      ...
    }
    ...
  }
}
```

The issue now is since our `authorize` action is started in the background, we can't get
the `token` result (because we'd have to wait for it). So we need to move the token storage
operation into the `authorize` task.

```javascript
import { fork, call, take, put } from 'redux-saga/effects'
import Api from '...'

function* authorize(user, password) {
  try {
    const token = yield call(Api.authorize, user, password)
    yield put({type: 'LOGIN_SUCCESS', token})
  } catch(error) {
    yield put({type: 'LOGIN_ERROR', error})
  }
}

function* loginFlow() {
  while(true) {
    const {user, password} = yield take('LOGIN_REQUEST')
    yield fork(authorize, user, password)
    yield take(['LOGOUT', 'LOGIN_ERROR'])
    yield call(Api.clearItem('token'))
  }
}
```

We're also doing `yield take(['LOGOUT', 'LOGIN_ERROR'])`. It means we are watching for
2 concurrent actions :

- If the `authorize` task succeeds before the user logouts, it'll dispatch a `LOGIN_SUCCESS`
action then terminates. Our `loginFlow` saga will then wait only for a future `LOGOUT` action
(because `LOGIN_ERROR` will never happen).

- If the `authorize` fails before the user logouts, it'll dispatch a `LOGIN_ERROR` action then
terminates. So `loginFlow` will take the `LOGIN_ERROR` before the `LOGOUT` then it'll enter in
a another `while` iteration and will wait for the next `LOGIN_REQUEST` action.

- If the user logouts before the `authorize` terminate, then `loginFlow` will take a `LOGOUT`
action and also wait for the next `LOGIN_REQUEST`.

Note the call for `Api.clearItem` is supposed to be idempotent. It'll have no effect if no token was
stored by the `authorize` call. `loginFlow` just make sure no token will be in the storage
before waiting for the next login.

But we've not yet done. If we take a `LOGOUT` in the middle of an Api call, we have
to **cancel** the `authorize` process, otherwise we'll have 2 concurrent tasks evolving in
parallel, otherwise, the `authorize` task will continue running and upon a successful (resp. failed)
result, will dispatch a `LOGIN_SUCCESS` (resp. a `LOGIN_ERROR`) action leading to an inconsistent state.


In order to cancel a forked task, we use a dedicated Effect [`cancel`](http://yelouafi.github.io/redux-saga/docs/api/index.html#canceltask)

```javascript
import { take, put, call, fork, cancel } from 'redux-saga/effects'

// ...

function* loginFlow() {
  while(true) {
    const {user, password} = yield take('LOGIN_REQUEST')
    // fork return a Task object
    const task = yield fork(authorize, user, password)
    const action = yield take(['LOGOUT', 'LOGIN_ERROR'])
    if(action.type === 'LOGOUT')
      yield cancel(task)
    yield call(Api.clearItem('token'))
  }
}
```

`yield fork` results in a [Task Object](http://yelouafi.github.io/redux-saga/docs/api/index.html#task). We assign
the returned object into a local constant `task`. Later if we take a `LOGOUT` action, we pass that task
to the `cancel` Effect. If the task is still running, it'll be aborted. If the task has already completed
then nothing will happen and the cancellation will result in a no-op. And finally, if the task
completed with an error, the we do nothing, because we know that the task has already completed.

Ok, we are *almost* done (yeah, concurrency it's not that easy, you have to take it seriously).

Suppose that when we receive a `LOGIN_REQUEST` action, our reducer sets some `isLoginPending` flag
to true so it can display some message or spinner in the UI. If we get a `LOGOUT` in the middle
of an Api call and abort the task by simply *killing it* (i.e. the task is stopped right away), then
we may endup again with an inconsistent state. Because we'll still have `isLoginPending` set to true
and our reducer waiting for an outcome action (`LOGIN_SUCCESS` or `LOGIN_ERROR`).

Fortunately, the `cancel` Effect won't brutally kill our `authorize` task, it'll instead throw
a special Error inside it to give it a chance to perform its cleanup logic. And the cancelled task
should catch this Error if it has something to do before terminating.

Our `authorize` already have a try/catch block, but it defines a generic handler which dispatches
`LOGIN_ERROR` actions on each error. But login cancellations aren't really errors.
It doesn't make sense to display an error message to the user we he logouts. So our `authorize`
task has to dispatch `LOGIN_ERROR` actions only on case of authorization failures.


```javascript
import { isCancelError } from 'redux-saga'
import { take, call, put } from 'redux-saga/effects'
import Api from '...'

function* authorize(user, password) {
  try {
    const token = yield call(Api.authorize, user, password)
    yield put({type: 'LOGIN_SUCCESS', token})
    return token
  } catch(error) {
    if(!isCancelError(error))
      yield put({type: 'LOGIN_ERROR', error})
  }
}
```

You may have noted that we still didn't do anyting about clearing our `isLoginPending` state.
For that, there are 2 possible solutions (and maybe others)

- dispatch a dedicated action `RESET_LOGIN_PENDING`

- or more simply, make the reducer clear the `isLoginPending` on a `LOGOUT` action.

## **More to come**
