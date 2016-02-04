# Waiting for future actions

In the previous example we created an `incrementAsync` Saga. The call `yield take(INCREMENT_ASYNC)` is an
illustration of how Sagas typically work.

Typically, actual middlewares handle some Effect form triggered by an Action Creator. For example,
redux-thunk handles *thunks* by calling them with `(getState, dispatch)` as arguments,
redux-promise handles Promises by dispatching their resolved values, and redux-gen handles generators by
dispatching all yielded actions to the store. The common thing that all those middlewares share is the
same 'call on each action' pattern. They will be called again and again each time an action happens,
i.e. they are *scoped* by the *root action* that triggered them.

Sagas work differently, they are not fired from within Action Creators but are started with your
application and choose what user actions to watch. They are like daemon tasks that run in
the background and choose their own logic of progression. In the example above, `incrementAsync` *pulls*
the `INCREMENT_ASYNC` action using `yield take(...)`. This is a *blocking call*, which means the Saga
will not progress until it receives a matching action.

Above, we used the form `take(INCREMENT_ASYNC)`, which means we're waiting for an action whose type
is `INCREMENT_ASYNC`.

`take` support some more patterns to constrain future actions matching. A call of `yield take(PATTERN)` will be
handled using the following rules

- If PATTERN is undefined or `'*'` all incoming actions are matched (e.g. `take()` will match all actions)

- If PATTERN is a function, the action is matched if PATTERN(action) is true (e.g. `take(action => action.entities)`
will match all actions having a (truthy) `entities`field.)

- If PATTERN is a string, the action is matched if `action.type === PATTERN` (as used above `take(INCREMENT_ASYNC)`

- If PATTERN is an array, action.type is matched against all items in the array (e.g. `take([INCREMENT, DECREMENT])` will
match either actions of type `INCREMENT` or `DECREMENT`).