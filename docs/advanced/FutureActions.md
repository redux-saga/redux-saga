# Pulling future actions

Until now we've used the helper effect `takeEvery` in order to spawn a new task on each incoming action. This mimics somewhat the behavior of redux-thunk: Each time a Component, for example, invokes a `fetchProducts` Action Creator, the Action Creator will dispatch a thunk to execute the control flow.

In reality, `takeEvery` is just a wrapper effect for internal helper function built on top of the lower level and more powerful API. In this section we'll see a new Effect, `take`, which makes it possible to build complex control flow by allowing total control of the action observation process.

## A simple logger

Let's take a simple example of a Saga that watches all actions dispatched to the store and logs them to the console.

Using `takeEvery('*')` (with the wildcard `*` pattern) we can catch all dispatched actions regardless of their types.

```javascript
import { select, takeEvery } from 'redux-saga/effects'

function* watchAndLog() {
  yield takeEvery('*', function* logger(action) {
    const state = yield select()

    console.log('action', action)
    console.log('state after', state)
  })
}
```

Now let's see how to use the `take` Effect to implement the same flow as above

```javascript
import { select, take } from 'redux-saga/effects'

function* watchAndLog() {
  while (true) {
    const action = yield take('*')
    const state = yield select()

    console.log('action', action)
    console.log('state after', state)
  }
}
```

Previously, we supplied `takeEvery` with an action type (`'*'`) and callback function (`logger`); we're now passing the action type to `take`, catching the whatever is given back to the generator in an `action` variable and wrapping the whole thing in an infinite `while` loop. Why is this pattern useful?

Because our `watchAndLog` process can now control when, if and how the action is processed. When using `takeEvery`, we couldn't control when `logger` would be be called; it was invoked on each matching action, again and again.

`take` inverts that control: Instead of the actions being *pushed* to the handler tasks, the Saga is *pulling* the action by itself. You can think of the `const action = yield take('*')` line as conceptually equivalent to `action = getNextAction()`.

> A note on the "infinite" while loop. Remember this is a Generator function, which doesn't have a run-to-completion behavior. Our Generator will block on each iteration waiting for an action to happen.

This inversion of control allows us to implement control flows that would be more difficult to achieve with the traditional *push* approach.

As a simple example, suppose that in a Todo application we want to congratulate the user after he has created his first three todos.

```javascript
import { take, put } from 'redux-saga/effects'

function* watchFirstThreeTodosCreation() {
  for (let i = 0; i < 3; i++) {
    const action = yield take('TODO_CREATED')
  }
  yield put({type: 'SHOW_CONGRATULATION'})
}
```

Instead of a `while (true)` we're running a `for` loop which will iterate only three times. After taking the first three `TODO_CREATED` actions, `watchFirstThreeTodosCreation` will cause the application to display a congratulation message before terminating -- the Generator will then be garbage collected and no more observations will occur.

Another benefit of the pull approach is that we can describe our control flow synchronously. 

For example, suppose we want to implement a login flow with two actions: `LOGIN` and `LOGOUT`. Using `takeEvery` (or `redux-thunk`) would require two separate tasks.

The unfortunate result is that our flow logic is now separated across two sites. In order to understand the code, a reader needs to review both handlers and make the conceptual link between the two sources of logic. She has to rebuild a model of the flow in her head -- a difficult mental task.

By using the pull model, we can write our flow in the same place instead of handling the same action repeatedly.

```javascript
function* loginFlow() {
  while (true) {
    yield take('LOGIN')
    // ... perform the login logic
    yield take('LOGOUT')
    // ... perform the logout logic
  }
}
```

The `loginFlow` Saga more clearly conveys the expected action sequence. It knows that the `LOGIN` action should always be followed by a `LOGOUT` action and that `LOGOUT` is always followed by a `LOGIN`. A good UI should always enforce a **consistent order** of actions.
