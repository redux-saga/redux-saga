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
  yield [
    fork(saga1),
    fork(saga2),
    fork(saga3)
  ]
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

While making use of `fork` rather than `all`, the behavior in your app is the same: all of your sub-sagas are started. The difference between these examples and the original implementation is in execution under the hood. `fork` is non-blocking and so allows the `rootSaga` in these two cases to finish while the child sagas are kept running and blocked by their internal effects.

Error handling in all three implementations is the same. Any error will terminate the root saga and subsequently all other children. (`fork` effects are still connected to their parent.)

## Keeping the root alive

In practice, these implementations aren't terribly practical because your rootSaga will terminate on the first error in any individual child effort or saga. Ajax requests in particular would put your application at the mercy of the status of any endpoints your application makes requests to.

To avoid these pitfalls, we can `spawn` our child sagas from the root, disconnecting them from their potentially terminated parent saga.

```javascript
export default function* root() {
  yield spawn(saga1)
  yield spawn(saga2)
  yield spawn(saga3)
}
```

Once again, though, uncaught errors are still problematic on a saga-by-saga basis as each saga can still be terminate by such a failure. It's *safer*, but does not provide a meaningful solution.

## Keeping everything alive

We need to think about catching errors separately for each individual saga, and giving that saga the opportunity to restart. In #570 user @granmoe proposed an implementation like this:

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
        } catch (e) {
          console.log(e)
        }
      }
    });
  );
};
```

This strategy maps our child sagas to spawned generators (detaching them from the root parent) which start our sagas as subtasks in a `try` block. Our saga will run until termination, and then be automatically restarted. The `catch` block harmlessly handles any error that may have been thrown by, and terminated, our saga.

