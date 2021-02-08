---
id: middleware
title: Middleware
hide_title: true
---

# Middleware

## `createSagaMiddleware(options)`

Creates a Redux middleware and connects the Sagas to the Redux Store

- `options: Object` - A list of options to pass to the middleware. Currently supported options are:
  - `context: Object` - initial value of the saga's context.

  - `sagaMonitor` : [SagaMonitor](#sagamonitor) - If a Saga Monitor is provided, the middleware will deliver monitoring events to the monitor.

  - `onError: (error: Error, { sagaStack: string })` - if provided, the middleware will call it with uncaught errors from Sagas. useful for sending uncaught exceptions to error tracking services.
  - `effectMiddlewares` : Function [] - allows you to intercept any effect, resolve it on your own and pass to the next middleware. See [this section](/docs/advanced/Testing.md#effectmiddlewares) for a detailed example


### Example

Below we will create a function `configureStore` which will enhance the Store with a new method `runSaga`. Then in our main module, we will use the method to start the root Saga of the application.

**configureStore.js**
```javascript
import createSagaMiddleware from 'redux-saga'
import reducer from './path/to/reducer'

export default function configureStore(initialState) {
  // Note: passing middleware as the last argument to createStore requires redux@>=3.1.0
  const sagaMiddleware = createSagaMiddleware()
  return {
    ...createStore(reducer, initialState, applyMiddleware(/* other middleware, */sagaMiddleware)),
    runSaga: sagaMiddleware.run
  }
}
```

**main.js**
```javascript
import configureStore from './configureStore'
import rootSaga from './sagas'
// ... other imports

const store = configureStore()
store.runSaga(rootSaga)
```

### Notes

See below for more information on the `sagaMiddleware.run` method.

## `middleware.run(saga, ...args)`

Dynamically run `saga`. Can be used to run Sagas **only after** the `applyMiddleware` phase.

- `saga: Function`: a Generator function
- `args: Array<any>`: arguments to be provided to `saga`

The method returns a [Task descriptor](#task-descriptor).

### Notes

`saga` must be a function which returns a [Generator Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator). The middleware will then iterate over the Generator and execute all yielded Effects.

`saga` may also start other sagas using the various Effects provided by the library. The iteration process described below is also applied to all child sagas.

In the first iteration, the middleware invokes the `next()` method to retrieve the next Effect. The middleware then executes the yielded Effect as specified by the Effects API below. Meanwhile, the Generator will be suspended until the effect execution terminates. Upon receiving the result of the execution, the middleware calls `next(result)` on the Generator passing it the retrieved result as an argument. This process is repeated until the Generator terminates normally or by throwing some error.

If the execution results in an error (as specified by each Effect creator) then the `throw(error)` method of the Generator is called instead. If the Generator function defines a `try/catch` surrounding the current yield instruction, then the `catch` block will be invoked by the underlying Generator runtime. The runtime will also invoke any corresponding finally block.

In the case a Saga is cancelled (either manually or using the provided Effects), the middleware will invoke `return()` method of the Generator. This will cause the Generator to skip directly to the finally block.