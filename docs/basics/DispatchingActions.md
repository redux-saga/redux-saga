# Dispatching actions to the store

Taking the previous example further, let's say that after each save, we want to dispatch some action
to notify the Store that the fetch has succeeded (we'll omit the failure case for the moment).

We could pass the Store's `dispatch` function to the Generator. Then the
Generator could invoke it after receiving the fetch response:

```javascript
// ...

function* fetchProducts(dispatch) {
  const products = yield call(Api.fetch, '/products')
  dispatch({ type: 'PRODUCTS_RECEIVED', products })
}
```

However, this solution has the same drawbacks as invoking functions directly from inside the Generator (as discussed in the previous section). If we want to test that `fetchProducts` performs
the dispatch after receiving the AJAX response, we'll need again to mock the `dispatch`
function.

Instead, we need the same declarative solution. Create a plain JavaScript Object to instruct the
middleware that we need to dispatch some action, and let the middleware perform the real
dispatch. This way we can test the Generator's dispatch in the same way: by inspecting
the yielded Effect and making sure it contains the correct instructions.

The library provides, for this purpose, another function `put` which creates the dispatch
Effect.

```javascript
import { call, put } from 'redux-saga/effects'
// ...

function* fetchProducts() {
  const products = yield call(Api.fetch, '/products')
  // create and yield a dispatch Effect
  yield put({ type: 'PRODUCTS_RECEIVED', products })
}
```

Now, we can test the Generator easily as in the previous section

```javascript
import { call, put } from 'redux-saga/effects'
import Api from '...'

const iterator = fetchProducts()

// expects a call instruction
assert.deepEqual(
  iterator.next().value,
  call(Api.fetch, '/products'),
  "fetchProducts should yield an Effect call(Api.fetch, './products')"
)

// create a fake response
const products = {}

// expects a dispatch instruction
assert.deepEqual(
  iterator.next(products).value,
  put({ type: 'PRODUCTS_RECEIVED', products }),
  "fetchProducts should yield an Effect put({ type: 'PRODUCTS_RECEIVED', products })"
)
```

Note how we pass the fake response to the Generator via its `next` method. Outside the
middleware environment, we have total control over the Generator, we can simulate a
real environment by mocking results and resuming the Generator with them. Mocking
data is a lot easier than mocking functions and spying calls.
