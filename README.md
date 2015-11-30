# redux-saga
Exploration of an alternative side effect model for Redux applications

For now, this is mostly a Proof Of Concept; for more infos see [this discussion](https://github.com/paldepind/functional-frontend-architecture/issues/20#issuecomment-160344891)


Instead of dispatching thunks which get handled by the redux-thunk middleware. You create *Sagas*
(not sure if the term applies correctly); to trigger side effects (or other actions) in reaction to actions.

# How does it work

- No application logic inside action creators. All action creators are pure factories of raw-data actions

- All the actions hit the reducers; even "asynchronous" ones.

- Sagas are generator functions that yield side effects as well as actions resulting from the execution
of those side effects.

- Sagas don't execute side effects themselves, they *create* a description of the intended side effect.
Then the side effect gets executed later by the appropriate service

- Services are normal redux middlewares which handle the triggered side effects. They communicate back
the results of their execution by returning Promises.

Sagas don't communicate directly with Services. Instead, the saga middleware acts like a mediator between the 2.
It takes effects yielded from the Saga, then dispatches those effects to the store. Since services are normal
middlewares, they intercept the dispatched effect, execute it and return a Promise denoting the future response.
The saga middleware then takes the service response and resumes the Saga generator with the resolved response. This way
Sagas can describe complex workflows with a simple synchronous style. And since they are side-effect free, they can
be tested simply by driving the generator function and testing the successive results.


And since services are normal middlewares, all yielded side effects go through the middleware pipeline.
For example, in the counter sample, TIMEOUT effects get also logged into the console, so we don't miss
any event in the application.

Another benefit (not tested yet), could be when replying actions in the devtools. We can disable the service execution
step and only use the recorded effect response.


Example with the 'incrementAsync' action from counter sample app.

```javascript
function* incrementAsync() {

  // yield a side effect : delay by 1000
  yield { [TIMEOUT]: 1000 }

  // yield an action : INCREMENT_COUNTER
  yield increment()

}

export default function* rootSaga(getSate, action) {
  if(action.type === INCREMENT_ASYNC)
    yield* incrementAsync()
}
```

The Saga triggers a 'TIMEOUT' effect, which will get handled by the appropriate service.
In this example it's the timeout middleware
```javascript
// from the redux-saga counter example services/index.js
function timeout() {
    return next => action => {
      if( action[TIMEOUT] )
        return new Promise(resolve => {
          setTimeout( () => resolve(true), action[TIMEOUT] )
        })
      else
        return next(action)
    }
}
```

You can also get the response returned from services inside your Saga, and use it
to yield further side effects or other actions. In the shopping-cart example,
we trigger an api call to get the list of products, then we yield a receiveProducts action
with the returned response from the api call

```javascript
// an "effect creator"
function callApi(endpoint, payload) {
  return { [API_CALL] : { endpoint, payload } }
}
// from the redux-saga shopping-cart example sagas/index.js
function* getAllProducts() {

  const products = yield callApi(GET_PRODUCTS)

  yield receiveProducts(products)

}

export default function* rootsaga(getState, action) {

  switch (action.type) {
    case GET_ALL_PRODUCTS:
      yield* getAllProducts(getState)
      break

    case CHECKOUT_REQUEST:
      yield* checkout(getState)
  }
}
```

Below, an example of testing a saga (from the shopping-cart example)

```javascript
test('getProducts Saga test', function (t) {

  const generator = saga( getState, actions.getAllProducts() )

  let nextRes = generator.next()
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, callApi(effects.GET_PRODUCTS))

  nextRes = generator.next(products) // resume with a dummy value
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, actions.receiveProducts(products))

  nextRes = generator.next()
  t.equal(nextRes.done, true)

  t.end()

});
```

Finally you can catch errors from the Service executing the side effect; if the Service
returns a rejected promise, an execption is thrown inside the Saga generator

```javascript
function* checkout(getState) {
  const cart = getState().cart

  try {
    yield callApi(BUY_PRODUCTS, cart)
    yield checkoutSuccess(cart)
  } catch(error) {
    yield checkoutFailure(error)
  }

}
```

# setup

`npm install`

There are 2 examples ported from the Redux repos. You can observe the logged actions/effects
into the console (logged via the redux-logger middleware).

Counter example
`npm run build-counter`

Shopping Cart example
`npm run build-shop`

There is also a test sample in the shopping-cart example
`npm run test-shop`
