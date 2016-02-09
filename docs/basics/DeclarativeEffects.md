# Declarative Effects

Sagas Generators can yield Effects in multiple forms. The simplest way is to yield a Promise.

```javascript
function* fetchSaga() {

  // fetch is a sample function
  // returns a Promise that will resolve with the GET response
  const products = yield fetch('/products')

  // dispatch a RECEIVE_PRODUCTS action
  yield put( receiveProducts(products) )
}
```

In the example above, `fetch('/products')` returns a Promise that will resolve with the GET response,
so the 'fetch effect' will be executed immediately. Simple and idiomatic but...

Suppose we want to test generator above:

```javascript
const iterator = fetchSaga()
assert.deepEqual( iterator.next().value, ?? ) // what do we expect ?
```

We want to check the result of the first value yielded by the generator, which is in our case the result of running
`fetch('/products')`. Executing the real service during tests is neither a viable nor practical approach, so we have to
*mock* the fetch service, i.e. we'll have to replace the real `fetch` method with a fake one which doesn't actually
run the GET request but only checks that we've called `fetch` with the right arguments (`'/products'` in our case).

Mocks make testing more difficult and less reliable. On the other hand, functions that simply return values are
easier to test, since we can use a simple `equal()` to check the result. This is the way to write the most reliable tests.

Not convinced? I encourage you to read this [Eric Elliott's article](https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d#.4ttnnzpgc):

>(...)`equal()`, by nature answers the two most important questions every unit test must answer, but most don’t:
- What is the actual output?
- What is the expected output?

>If you finish a test without answering those two questions, you don’t have a real unit test. You have a sloppy, half-baked test.

What we actually need is just to make sure the `fetchSaga` yields a call with the right function and the right
arguments. For this reason, the library provides some declarative ways to yield Side Effects while still making it
easy to test the Saga logic

```javascript
import { call } from 'redux-saga'

function* fetchSaga() {
  const products = yield call( fetch, '/products' ) // don't run the effect
}
```

We're using now the `call(fn, ...args)` function. **The difference from the preceding example is that now we're not
executing the fetch call immediately, instead, `call` creates a description of the effect**. Just as in
Redux you use action creators to create a plain object describing the action that will get executed by the Store,
`call` creates a plain object describing the function call. The redux-saga middleware takes care of executing
the function call and resuming the generator with the resolved response.


This allows us to easily test the Generator outside the Redux environment.

```javascript
import { call } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, call(fetch, '/products')) // expects a call(...) value
```

Now we don't need to mock anything, and a simple equality test will suffice.

The advantage of declarative effects is that we can test all the logic inside a Saga/Generator
by simply iterating over the resulting iterator and doing a simple equality tests on the values
yielded successively. This is a real benefit, as your complex asynchronous operations are no longer
black boxes, and you can test in detail their operational logic no matter how complex it is.

To invoke methods of some object (i.e. created with `new`), you can provide a `this` context to the
invoked functions using the following form:

```javascript
yield call([obj, obj.method], arg1, arg2, ...) // as if we did obj.method(arg1, arg2 ...)
```

`apply` is an alias for the method invocation form

```javascript
yield apply(obj, obj.method, [arg1, arg2, ...])
```

`call` and `apply` are well suited for functions that return Promise results. Another function
`cps` can be used to handle Node style functions (e.g. `fn(...args, callback)` where `callback`
is of the form `(error, result) => ()`). For example:

```javascript
import { cps } from 'redux-saga'

const content = yield cps(readFile, '/path/to/file')
```

and of course you can test it just like you test call:

```javascript
import { cps } from 'redux-saga'

const iterator = fetchSaga()
assert.deepEqual(iterator.next().value, cps(readFile, '/path/to/file') )
```

`cps` supports also the same method invocation form as `call`.
