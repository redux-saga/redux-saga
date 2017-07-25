# Glossary

This is a glossary of the core terms in Redux Saga.

### Effect

An effect is a plain JavaScript Object containing some instructions to be executed by the saga middleware.

You create effects using factory functions provided by the redux-saga library. For example you use
`call(myfunc, 'arg1', 'arg2')` to instruct the middleware to invoke `myfunc('arg1', 'arg2')` and return
the result back to the Generator that yielded the effect

### Task

A task is like a process running in background. In a redux-saga based application there can be
multiple tasks running in parallel. You create tasks by using the `fork` function

```javascript
import {fork} from "redux-saga/effects"

function* saga() {
  ...
  const task = yield fork(otherSaga, ...args)
  ...
}
```

### Blocking/Non-blocking call

A Blocking call means that the Saga yielded an Effect and will wait for the outcome of its execution before
resuming to the next instruction inside the yielding Generator.

A Non-blocking call means that the Saga will resume immediately after yielding the Effect.

For example

```javascript
import {call, cancel, join, take, put} from "redux-saga/effects"

function* saga() {
  yield take(ACTION)              // Blocking: will wait for the action
  yield call(ApiFn, ...args)      // Blocking: will wait for ApiFn (If ApiFn returns a Promise)
  yield call(otherSaga, ...args)  // Blocking: will wait for otherSaga to terminate

  yield put(...)                   // Non-Blocking: will dispatch within internal scheduler

  const task = yield fork(otherSaga, ...args)  // Non-blocking: will not wait for otherSaga
  yield cancel(task)                           // Non-blocking: will resume immediately
  // or
  yield join(task)                              // Blocking: will wait for the task to terminate
}
```

### Watcher/Worker

refers to a way of organizing the control flow using two separate Sagas

- The watcher: will watch for dispatched actions and fork a worker on every action

- The worker: will handle the action and terminate

example

```javascript
function* watcher() {
  while (true) {
    const action = yield take(ACTION)
    yield fork(worker, action.payload)
  }
}

function* worker(payload) {
  // ... do some stuff
}
```
