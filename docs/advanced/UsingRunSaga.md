# Dynamically starting Sagas with runSaga

The `runSaga` function allows starting sagas outside the Redux middleware environment. It also allows you to hook up to external input/output, other than store actions.

For example, you can start a Saga on the server using:

```javascript
import serverSaga from 'somewhere'
import {runSaga, storeIO} from 'redux-saga'
import configureStore from 'somewhere'
import rootReducer from 'somewhere'

const store = configureStore(rootReducer)
runSaga(
  serverSaga(store.getState),
  storeIO(store)
).done.then(...)
```

`runSaga` returns a task object. Just like the one returned from a `fork` effect.

Besides taking and dispatching actions to the store `runSaga` can also be connected to other input/output sources. This allows you to exploit all the features of sagas to implement control flows outside Redux.

The method has the following signature

```javascript
runSaga(iterator, {subscribe, dispatch}, [monitor])
```

## Arguments

- `iterator: {next, throw}` : an iterator object, Typically created by invoking a Generator function

- `subscribe(callback) => unsubscribe`: i.e. a function which accepts a callback and returns an unsubscribe function

  - `callback(action)` : callback (provided by runSaga) used to subscribe to input events. `subscribe` must support registering multiple subscriptions

  - `unsubscribe()` : used by `runSaga` to unsubscribe from the input source once it has completed (either by normal return or a thrown exception)

- `dispatch(action) => result`: used to fulfill `put` effects. Each time a `yield put(action)` is issued, `dispatch` is invoked with `action`. The return value of `dispatch` is used to fulfill the `put` effect. Promise results are automatically resolved/rejected.

- `monitor(sagaAction)` (optional): a callback which is used to dispatch all Saga related events. In the middleware version, all actions are dispatched to the Redux store. See the [sagaMonitor example](https://github.com/yelouafi/redux-saga/blob/master/examples/sagaMonitor.js) for usage.

The `subscribe` argument is used to fulfill `take(action)` effects. Each time `subscribe` emits an action
to its callbacks, all sagas that are blocked on `take(PATTERN)`, and whose take pattern matches the currently incoming action, are resumed with that action.