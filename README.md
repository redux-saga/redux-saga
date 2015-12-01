# redux-saga
Exploration of an alternative side effect model for Redux applications

For now, this is mostly a Proof Of Concept; for more infos see [this discussion](https://github.com/paldepind/functional-frontend-architecture/issues/20#issuecomment-160344891)


Instead of dispatching thunks which get handled by the redux-thunk middleware. You create *Sagas* to gather all your
Side effects logic in a central place.

A Saga is a generator function that takes `(getState, action)` and can yield side effects as well as
other actions.

Example

```javascript
// counterSaga
function* counterSaga(getSate, action) {
  if(action.type === INCREMENT_ASYNC)
    yield* incrementAsync() // delegate to another Saga
}

function* incrementAsync() {

  // yield a side effect : delay by 1000
  yield [delay, 1000] 
  // you can also yield :
  // a thunk         : yield () => delay(1000)
  // a dispatch item : yield {[TIMEOUT]: 1000} which will get handled by a dedicated middleware

  // yield an action : INCREMENT_COUNTER
  yield increment()

}

// configure the store
import sagaMiddleware from 'redux-saga'
import createLogger from 'redux-logger'
import reducer from '../reducers'
import saga from '../sagas'

const createStoreWithSaga = applyMiddleware(
  createLogger(),
  sagaMiddleware(saga)
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
`try/catch` block.

Here is the Saga code from the Shopping cart example. Note that Sagas compose using the `yield *` operator.

```javascript
function* getAllProducts() {
  const products = yield [api.getProducts]
  yield actions.receiveProducts(products)
}

function* checkout(getState) {
  const cart = getState().cart

  try {
    yield [api.buyProducts, cart]
    yield actions.checkoutSuccess(cart)
  } catch(error) {
    yield actions.checkoutFailure(error)
  }
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

# setup and run the example

`npm install`

There are 2 examples ported from the Redux repos. You can observe the logged actions/effects
into the console (logged via the redux-logger middleware).

Counter example
`npm run build-counter`

Shopping Cart example
`npm run build-shop`

There is also a test sample in the shopping-cart example
`npm run test-shop`
