# Setting up your root Saga

In the beginner tutorial it is shown that your root saga will look something like this

```javascript
export default function* rootSaga() {
  yield all([
    helloSaga(),
    watchIncrementAsync()
  ])
  // code after all-effect
}
```

This is one of a few ways to implement your root. Here, the `all` effect is used with an array and your sagas will be executed in parallel. Other root implementations may help you better handle errors and more complex data flow.

Contributor @slorber mentioned in [issue#760](https://github.com/redux-saga/redux-saga/issues/760) several other common root implementations. To start, there is one popular implementation that behaves similarly to the tutorial root saga behavior:

```javascript
export default function* root() {
  yield fork(saga1)
  yield fork(saga2)
  yield fork(saga3)
  // code after fork-effect
}
```

Using three unique `yield fork` will give back a task descriptor three times. The resulting behavior in your app is that all of your sub-sagas are started and executed in the same order. `fork` is non-blocking and so allows the `rootSaga` in these two cases to finish while the child sagas are kept running and blocked by their internal effects.

The difference between one big all effect and several fork effects are that all effect is blocking, so *code after all-effect* (see comments in above code) is executed after all the children sagas completes, while fork effects are non-blocking and *code after fork-effect* gets executed right after yielding fork effects. Another difference is that you can get task descriptors when using fork effects, so in the subsequent code you can cancel/join the forked task via task descriptors.

## Nesting fork effects in all effect

```javascript
const [task1, task2, task3] = yield all([ fork(saga1), fork(saga2), fork(saga3) ])
```

There is another popular pattern when designing root saga: nesting `fork` effects in an `all` effect. By doing so, you can get an array of task descriptors, and the code after the `all` effect will be executed immediately because each `fork` effect is non-blocking and synchronously returning a task descriptor.

Note that though `fork` effects are nested in an `all` effect, they are always connected to the parent task through the underlying forkQueue. Uncaught errors from forked tasks bubble to the parent task and thus abort it (and all its child tasks) - they cannot be caught by the parent task.

## Avoid nesting fork effects in race effect

```javascript
// DO NOT DO THIS. The fork effect always win the race immediately.
yield race([
  fork(someSaga),
  take('SOME-ACTION'),
  somePromise,
])
```

On the other hand, `fork` effects in a `race` effect is most likely a bug. In the above code, since `fork` effects are non-blocking, they will always win the race immediately.

## Keeping the root alive

In practice, these implementations aren't terribly practical because your rootSaga will terminate on the first error in any individual child effect or saga and crash your whole app! Ajax requests in particular would put your app at the mercy of the status of any endpoints your app makes requests to.

`spawn` is an effect that will *disconnect* your child saga from its parent, allowing it to fail without crashing it's parent. Obviously, this does not relieve us from our responsibility as developers from still handling errors as they arise. In fact, it's possible that this might obscure certain failures from developer's eyes and cause problems further down the road.

The `spawn` effect might be considered similar to [Error Boundaries](https://reactjs.org/docs/error-boundaries.html) in React in that it can be used as extra safety measure at some level of the saga tree, cutting off a single feature or something and not letting the whole app crash. The difference is that there is no special syntax like the `componentDidCatch` that exists for React Error Boundaries. You must still write your own error handling and recovery code.

```javascript
export default function* root() {
  yield spawn(saga1)
  yield spawn(saga2)
  yield spawn(saga3)
}
```

## Keeping everything alive

In some cases, it may be desirable for your sagas to be able to restart in the event of failure. The benefit is that your app and sagas may continue to work after failing, i.e. a saga that `yield takeEvery(myActionType)`. But we do not recommend this as a blanket solution to keep all sagas alive. It is very likely that it makes more sense to let your saga fail in sanely and predictably and handle/log your error.

For example, @ajwhite offered this scenario as a case where keeping your saga alive would cause more problems than it solves:

```javascript
function* sagaThatMayCrash () {
  // wait for something that happens _during app startup_
  yield take(APP_INITIALIZED)

  // assume it dies here
  yield call(doSomethingThatMayCrash)
}
```
> If the sagaThatMayCrash is restarted, it will restart and wait for an action that only happens once when the application starts up. In this scenario, it restarts, but it never recovers.

But for the specific situations that would benefit from starting, user @granmoe proposed an implementation like this in issue #570:

```javascript
function* rootSaga () {
  const sagas = [
    saga1,
    saga2,
    saga3,
  ];

  yield all(sagas.map(saga =>
    spawn(function* () {
      while (true) {
        try {
          yield call(saga)
          break
        } catch (e) {
          console.log(e)
        }
      }
    }))
  );
}
```

This strategy maps our child sagas to spawned generators (detaching them from the root parent) which start our sagas as subtasks in a `try` block. Our saga will run until termination, and then be automatically restarted. The `catch` block harmlessly handles any error that may have been thrown by, and terminated, our saga.

