# Composing Sagas

While using `yield*` provides an idiomatic way of composing Sagas, this approach has some limitations:

- You'll likely want to test nested generators separately. This leads to some duplication in the test code as well as the overhead of the duplicated execution. We don't want to execute a nested generator but only make sure the call to it was issued with the right argument.

- More importantly, `yield*` allows only for sequential composition of tasks, so you can only `yield*` to one generator at a time.

You can use `yield` to start one or more subtasks in parallel. When yielding a call to a generator, the Saga will wait for the generator to terminate before progressing, then resume with the returned value (or throws if an error propagates from the subtask).

```javascript
function* fetchPosts() {
  yield put(actions.requestPosts())
  const products = yield call(fetchApi, '/products')
  yield put(actions.receivePosts(products))
}

function* watchFetch() {
  while (yield take(FETCH_POSTS)) {
    yield call(fetchPosts) // waits for the fetchPosts task to terminate
  }
}
```

Yielding to an array of nested generators will start all the sub-generators in parallel, wait
for them to finish, then resume with all the results

```javascript
function* mainSaga(getState) {
  const results = yield all([call(task1), call(task2), ...])
  yield put(showResults(results))
}
```

In fact, yielding Sagas is no different than yielding other effects (future actions, timeouts, etc). This means you can combine those Sagas with all the other types using the effect combinators.

For example, you may want the user to finish some game in a limited amount of time:

```javascript
function* game(getState) {
  let finished
  while (!finished) {
    // has to finish in 60 seconds
    const {score, timeout} = yield race({
      score: call(play, getState),
      timeout: delay(60000)
    })

    if (!timeout) {
      finished = true
      yield put(showScore(score))
    }
  }
}
```
