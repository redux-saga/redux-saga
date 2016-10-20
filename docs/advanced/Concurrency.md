# Concurrency

In the basics section, we saw how to use the helper effects `takeEvery` and `takeLatest` in order to manage concurrency between Effects.

In this section we'll see how those helpers are implemented using the low-level Effects.

## `takeEvery`

```javascript
function* takeEvery(pattern, saga, ...args) {
  const task = yield fork(function* () {
    while (true) {
      const action = yield take(pattern)
      yield fork(saga, ...args.concat(action))
    }
  })
  return task
}
```

`takeEvery` allows multiple `saga` tasks to be forked concurrently.

## `takeLatest`

```javascript
function* takeLatest(pattern, saga, ...args) {
  const task = yield fork(function* () {
    let lastTask
    while (true) {
      const action = yield take(pattern)
      if (lastTask)
        yield cancel(lastTask) // cancel is no-op if the task has already terminated

      lastTask = yield fork(saga, ...args.concat(action))
    }
  })
  return task
}
```

`takeLatest` doesn't allow multiple Saga tasks to be fired concurrently. As soon as it gets a new dispatched action, it cancels any previously-forked task (if still running).

`takeLatest` can be useful to handle AJAX requests where we want to only have the response to the latest request.
