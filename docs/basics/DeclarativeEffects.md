# Declarative Effects

In `redux-saga`, Sagas are implemented using Generator functions. To express the Saga logic we yield plain JavaScript Objects from the Generator. We call those Objects *Effects*. An Effect is simply an object which contains some information to be interpreted by the middleware. You can view Effects like instructions to the middleware to perform some operation (invoke some asynchronous function, dispatch an action to the store).

To create Effects, you use the functions provided by the library in the `redux-saga/effects` package.

In this section and the following, we will introduce some basic Effects. And see how the concept allows the Sagas to be easily tested.

Sagas can yield Effects in multiple forms. The simplest way is to yield a Promise.

For example, suppose we have a Saga that watches a `PRODUCTS_REQUESTED` action. On each matching action, it starts a task to fetch a list of products from a server.

```javascript
import { takeEvery } from 'redux-saga/effects'
import Api from './path/to/api'

function* watchFetchProducts() {
  yield takeEvery('PRODUCTS_REQUESTED', fetchProducts)
}

function* fetchProducts() {
  const products = yield Api.fetch('/products')
  console.log(products)
}
```

In the example above, we are invoking `Api.fetch` directly from inside the Generator. (In Generator functions, any expression to the right of `yield` is evaluated before yielding the result to the caller).

`Api.fetch('/products')` triggers an AJAX request that returns a Promise. The AJAX request will be executed immediately; the returned Promise will resolve on a successful response. Simple and idiomatic.

But suppose we want to test the `fetchProducts` generator:

```javascript
const iterator = fetchProducts()
assert.deepEqual(iterator.next().value, ??) // what do we expect?
```

We want to check the result of the first value yielded by the generator, which is the Promise that `Api.fetch('/products')` returns. But executing the real service during tests isn't viable or practical.

One option is to *mock* the `Api.fetch` function by replacing it with a fake version that avoids making an actual AJAX call while checking that we've supplied the expected arguments (`'/products'` in this case).

But mocks make testing more difficult and less reliable. Functions that simply return values are much easier to test, since we can use a simple `equal()` to check the result.

Not convinced? I encourage you to read [Eric Elliott's article](https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d#.4ttnnzpgc):

> (...)`equal()`, by nature answers the two most important questions every unit test must answer,
but most don’t:
- What is the actual output?
- What is the expected output?
>
> If you finish a test without answering those two questions, you don’t have a real unit test. You have a sloppy, half-baked test.

What we actually need is to make sure the `fetchProducts` task yields a call with the right function (`Api.fetch`) and the right arguments (`'/products'`). So instead of invoking the asynchronous function directly from inside Generator, we can yield a **description** of a function call. Much like dispatched Action objects in Redux, our Saga will simply yield an object which looks like:

```javascript
// Effect -> call the function Api.fetch with `./products` as argument
{
  CALL: {
    fn: Api.fetch,
    args: ['./products']
  }
}
```

Put another way, the Generator will yield plain Objects containing *instructions*. The `redux-saga` middleware will take care of executing those instructions, returning the result back to the Generator. This makes testing much easier: All we need to do is to check that a Generator yields the expected instruction object with a `deepEqual` assertion.

The `call` helper method provides this functionality, offering a more test-friendly way to perform asynchronous calls.

```javascript
import { call } from 'redux-saga/effects'

function* fetchProducts() {
  const products = yield call(Api.fetch, '/products')
  // ...
}
```

Now, instead of executing `Api.fetch('/products')` immediately, the `call` function generates an object that tells our middleware to execute the fetch call and resume the Generator with the resolved response. Outsourcing the asynchronous call to our middleware means we can test our saga based on `call`'s plain-object output.

```javascript
import { call } from 'redux-saga/effects'
import Api from '...'

const iterator = fetchProducts()

// expects a call instruction
assert.deepEqual(
  iterator.next().value, // { CALL: { fn: Api.fetch, args: ['./products'] } }
  call(Api.fetch, '/products'), // { CALL: { fn: Api.fetch, args: ['./products'] } }
  "fetchProducts should yield an Effect call(Api.fetch, './products')"
)
```

No more mocking!

There's a huge advantage to adopting this *declarative call* pattern. All the logic inside a Saga can now be tested by simply iterating over a Generator and asserting `deepEqual`'s on the descriptive objects that `call` returns. Your complex asynchronous operations are no longer black boxes.

`call` also supports method invocation; you can provide a `this` context to any functions with the following form:

```javascript
yield call([obj, obj.method], arg1, arg2, ...) // as if we did obj.method(arg1, arg2 ...)
```

`apply` is an alias for the method invocation form

```javascript
yield apply(obj, obj.method, [arg1, arg2, ...])
```

`call` and `apply` are well suited for functions that return Promises. Another function, `cps`, can be used to handle Node-style functions (e.g. `fn(...args, callback)`, where `callback` is of the form `(error, result) => ()`). `cps` stands for Continuation Passing Style.

For example:

```javascript
import { cps } from 'redux-saga/effects'

const content = yield cps(readFile, '/path/to/file')
```

And of course you can test it just like you test `call`:

```javascript
import { cps } from 'redux-saga/effects'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, cps(readFile, '/path/to/file') )
```

`cps` also supports the same method invocation form as `call`.