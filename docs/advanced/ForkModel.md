# redux-saga's fork model

In `redux-saga` you can dynamically fork tasks that execute in the background using 2 Effects

- `fork` is used to create *attached forks*
- `spawn` is used to create *detached forks*

## Attached forks (using `fork`)

Attached forks remain attached to their parent by the following rules

### Completion

- A Saga terminates only after
  - It terminates its own body of instructions
  - All attached forks are themselves terminated

For example say we have the following

```js
import { fork, call, put, delay } from 'redux-saga/effects'
import api from './somewhere/api' // app specific
import { receiveData } from './somewhere/actions' // app specific

function* fetchAll() {
  const task1 = yield fork(fetchResource, 'users')
  const task2 = yield fork(fetchResource, 'comments')
  yield delay(1000)
}

function* fetchResource(resource) {
  const {data} = yield call(api.fetch, resource)
  yield put(receiveData(data))
}

function* main() {
  yield call(fetchAll)
}
```

`call(fetchAll)` will terminate after:

- The `fetchAll` body itself terminates, this means all 3 effects are performed. Since `fork` effects are non blocking, the
task will block on `delay(1000)`

- The 2 forked tasks terminate, i.e. after fetching the required resources and putting the corresponding `receiveData` actions

So the whole task will block until a delay of 1000 millisecond passed *and* both `task1` and `task2` finished their business.

Say for example, the delay of 1000 milliseconds elapsed and the 2 tasks haven't yet finished, then `fetchAll` will still wait
for all forked tasks to finish before terminating the whole task.

The attentive reader might have noticed the `fetchAll` saga could be rewritten using the parallel Effect

```js
function* fetchAll() {
  yield all([
    call(fetchResource, 'users'),     // task1
    call(fetchResource, 'comments'),  // task2,
    delay(1000)
  ])
}
```

In fact, attached forks shares the same semantics with the parallel Effect:

- We're executing tasks in parallel
- The parent will terminate after all launched tasks terminate


And this applies for all other semantics as well (error and cancellation propagation). You can understand how
attached forks behave by considering it as a *dynamic parallel* Effect.

## Error propagation

Following the same analogy, Let's examine in detail how errors are handled in parallel Effects

for example, let's say we have this Effect

```js
yield all([
  call(fetchResource, 'users'),
  call(fetchResource, 'comments'),
  delay(1000)
])
```

The above effect will fail as soon as any one of the 3 child Effects fails. Furthermore, the uncaught error will cause
the parallel Effect to cancel all the other pending Effects. So for example if `call(fetchResource, 'users')` raises an
uncaught error, the parallel Effect will cancel the 2 other tasks (if they are still pending) then aborts itself with the
same error from the failed call.

Similarly for attached forks, a Saga aborts as soon as

- Its main body of instructions throws an error

- An uncaught error was raised by one of its attached forks

So in the previous example

```js
//... imports

function* fetchAll() {
  const task1 = yield fork(fetchResource, 'users')
  const task2 = yield fork(fetchResource, 'comments')
  yield delay(1000)
}

function* fetchResource(resource) {
  const {data} = yield call(api.fetch, resource)
  yield put(receiveData(data))
}

function* main() {
  try {
    yield call(fetchAll)
  } catch (e) {
    // handle fetchAll errors
  }
}
```

If at a moment, for example, `fetchAll` is blocked on the `delay(1000)` Effect, and say, `task1` failed, then the whole
`fetchAll` task will fail causing

- Cancellation of all other pending tasks. This includes:
  - The *main task* (the body of `fetchAll`): cancelling it means cancelling the current Effect `delay(1000)`
  - The other forked tasks which are still pending. i.e. `task2` in our example.

- The `call(fetchAll)` will raise itself an error which will be caught in the `catch` body of `main`

Note we're able to catch the error from `call(fetchAll)` inside `main` only because we're using a blocking call. And that
we can't catch the error directly from `fetchAll`. This is a rule of thumb, **you can't catch errors from forked tasks**. A failure
in an attached fork will cause the forking parent to abort (Just like there is no way to catch an error *inside* a parallel Effect, only from
outside by blocking on the parallel Effect).


## Cancellation

Cancelling a Saga causes the cancellation of:

- The *main task* this means cancelling the current Effect where the Saga is blocked

- All attached forks that are still executing


**WIP**

## Detached forks (using `spawn`)

Detached forks live in their own execution context. A parent doesn't wait for detached forks to terminate. Uncaught
errors from spawned tasks are not bubbled up to the parent. And cancelling a parent doesn't automatically cancel detached
forks (you need to cancel them explicitly).

In short, detached forks behave like root Sagas started directly using the `middleware.run` API.


**WIP**
