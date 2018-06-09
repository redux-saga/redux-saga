# Setting up your root Saga

In the beginner tutorial it is shown that your root saga will look something like this

```javascript
export default function* rootSaga() {
  yield all([
    helloSaga(),
    watchIncrementAsync()
  ])
}
```

This is really just one of a few ways to implement your root. Here, the `all` effect is used with an array of your sagas in a non-blocking fashion. Other root implementations may help you better handle errors and more complex data flow.

Contributor @slorber mentioned in issue #760 several other common root implementations. To start, there are some other implementations you may see that will behave similarly to the  tutorial root saga behavior:

```javascript
export default function* root() {
  yield all([
    fork(saga1),
    fork(saga2),
    fork(saga3)
  ]);
}
```
or 

```javascript
export default function* root() {
  yield fork(saga1)
  yield fork(saga2)
  yield fork(saga3)
}
```

`all (fork fork fork)` will return a single effect, while using three unique `yield fork` will give back a fork effect three times. Ultimately the resulting behavior in your app is the same: all of your sub-sagas are started and executed in the same order. `fork` is non-blocking and so allows the `rootSaga` in these two cases to finish while the child sagas are kept running and blocked by their internal effects.

Error handling in all three implementations is the same. Any error will terminate the root saga and subsequently all other children. (`fork` effects are still connected to their parent.)

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

  yield sagas.map(saga =>
    spawn(function* () {
      while (true) {
        try {
          yield call(saga)
          break
        } catch (e) {
          console.log(e)
        }
      }
    });
  );
};
```

This strategy maps our child sagas to spawned generators (detaching them from the root parent) which start our sagas as subtasks in a `try` block. Our saga will run until termination, and then be automatically restarted. The `catch` block harmlessly handles any error that may have been thrown by, and terminated, our saga.

