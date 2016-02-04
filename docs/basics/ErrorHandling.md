# Error handling

You can catch errors inside the Generator using the simple try/catch syntax. In the following example,
the Saga catch errors from the `api.buyProducts` call (i.e. a rejected Promise)

```javascript
function* checkout(getState) {

  while( yield take(types.CHECKOUT_REQUEST) ) {
    try {
      const cart = getState().cart
      yield call(api.buyProducts, cart)
      yield put(actions.checkoutSuccess(cart))
    } catch(error) {
      yield put(actions.checkoutFailure(error))
    }
  }
}
```

Of course you're not forced to handle you API errors inside `try`/`catch` blocks, you can also make
your API service return a normal value with some error flag on it.

```javascript
function buyProducts(cart) {
  return doPost(...)
    .then(result => {result})
    .catch(error => {error})
}

function* checkout(getState) {
  while( yield take(types.CHECKOUT_REQUEST) ) {
    const cart = getState().cart
    const {result, error} = yield call(api.buyProducts, cart)
    if(!error)
      yield put(actions.checkoutSuccess(result))
    else
      yield put(actions.checkoutFailure(error))
  }
}
```
