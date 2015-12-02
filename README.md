# redux-saga
An alternative side effect model for Redux applications.

Instead of dispatching thunks which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side effects logic in a central place.

A Saga is a generator function that takes `(getState, action)` and can yield side effects as well as
other actions.

Example

Install
```
npm install redux-saga
```

Create the Saga
```javascript
function* checkout(getState) {
  const cart = getState().cart
  try {
    // yield a side effect : an api call that returns a promise
    const cart1 = yield [api.buyProducts, cart]

    // yield an action with the response from the api call
    yield actions.checkoutSuccess(cart1)
  } catch(error) {
    // catch errors from a rejected promise
    yield actions.checkoutFailure(error)
  }
}

function* getAllProducts() {
  // you can also yield thunks
  const products = yield () => api.getProducts()
  yield actions.receiveProducts(products)
}

export default function* rootSaga(getState, action) {
  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      yield* getAllProducts(getState)
      break

    case types.CHECKOUT_REQUEST:
      yield* checkout(getState)
  }
}
```

Plug redux-saga in the middleware pipeline
```javascript
const createStoreWithSaga = applyMiddleware(
  // ...,
  sagaMiddleware(rootSaga)
)(createStore)

export default function configureStore(initialState) {
  return createStoreWithSaga(reducer, initialState)
}
```

The difference from redux-thunk, is that the decision of what to dispatch is not scattered throughout
the action creators, but instead centralized in one place that is an integrated part of you domain logic.


# How does it work

- No application logic inside action creators. All action creators are pure factories of raw-data actions

- All the actions hit the reducers; even "asynchronous" ones. All actions hit also the Saga.

- Reducers are responsible of transitioning state between actions

- Sagas are responsible of orchestrating operations (side effects or actions)

- Sagas are generator functions that can yield
  - a thunk of the side effet : `yield () => api.buyProducts(cart)`
  - an array `[fn, ...args]`: `yield () => [api.buyProducts, cart]`
  - a dispatch item `yield {[API_CALL]: { endpoint: 'getProducts', payload: [cart] }}`

Sagas don't execute side effects themselves, they *create* the intended side effect.
Then the side effect gets executed later by the appropriate service (either a middleware or a simple function).
Services return Promise to denote their future results.

The saga middleware takes the service response and resumes the Saga generator with the resolved response. This way
Sagas can describe complex workflows with a simple synchronous style. And since they are side-effect free, they can
be tested simply by driving the generator function and testing the successive results.

You can get the response returned from services inside your Saga, and use it
to yield further side effects or other actions. If the service responds with a rejected
promise, an exception is thrown inside the generator and can be handled by a normal
`try/catch` block (see above example).


# Build from sources and run tests

```
git clone https://github.com/yelouafi/redux-saga.git

npm test
```

There are 2 examples ported from the Redux repos. You can observe the logged actions/effects
into the console (logged via the redux-logger middleware).

Counter example
```
// build the example
npm run build-counter

// test sample for the generator
npm run test-counter
```

Shopping Cart example
```
// build the example
npm run build-shop

// test sample for the generator
npm run test-shop
```
