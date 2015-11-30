# redux-saga
Exploration of an alternative side effect model for Redux applications

For now, this is mostly a Proof Of Concept; for more infos see [this discussion](https://github.com/paldepind/functional-frontend-architecture/issues/20#issuecomment-160344891)


Instead of dispatching thunks which get handled by the redux-thunk middleware. You create *Sagas*
(not even sure if the term applies correctly); to trigger side effects (od other actions) in reaction to actions.

# Motivations

- No application logic inside action creators. All action creators are pure factories of raw-data actions
- All the actions hit the reducers; even "asynchronous" ones.
- Sagas are generator functions that yield side effects as well as actions resulting from the execution
of those side effects.
- Sagas don't execute side effects themselves, they *create* a description of the intended side effect.
Then the side effect gets executed later by the appropriate service
- Services are normal redux middlewares which handle the triggered side effects. They communicate back
the results of their execution by returning Promises.

Sagas don't communicate directly with Services. Instead, the saga middleware acts like a mediator between the 2.
It takes effects yielded from the Saga, then dispatch those effects to the store. Since services are normal
middlewares, they intercept the dispatched effect, execute it and return a Promise denoting the future response.
The saga middleware takes the service response and resume the saga generator with the resolved response. This way
Sagas can describe complex workflows with a simple synchronous style. And since they are side-effect free, they can
be tested simply by driving the generator function and testing the successive results.


And since services are normal middlewares, all yielded side effects go through the middleware pipeline.
For example, in the counter sample, TIMEOUT effects get also logged into the console, so we don't miss
any event in the application.

Another benefit (not tested yet), is when replying actions in the devtools. We can disable the service execution
step and only use the recorded effect response.

# How does it work

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
to yield further side effects or other actions. for example in the shopping-cart example,
we trigger an api call to get the list of products, then we yield a receiveProducts action
with the returned response from the api call

```javascript
// from the redux-saga shopping-cart example sagas/index.js
function* getAllProducts() {

  const products = yield callApi(GET_PRODUCTS)

  yield receiveProducts(products)

}

function* checkout(getState) {...}

export default function* rootsaga(getState, action) {

  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      yield* getAllProducts(getState)
      break

    case types.CHECKOUT_REQUEST:
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

# setup

`npm install`

There are 2 examples ported from the Redux repos. You can observe the logged action
into the console (logged via the redux-logger middleware).

Counter example
`npm run build-counter`

Shopping Cart example
`npm run build-shop`

There is also a test sample in the shopping-cart example
`npm run test-shop`
