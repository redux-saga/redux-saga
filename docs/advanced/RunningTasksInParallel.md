#Running Tasks In Parallel

The `yield` statement is great for representing asynchronous control flow in a simple and linear style, but we also need to do things in parallel. We can't simply write:

```javascript
// wrong, effects will be executed in sequence
const users  = yield call(fetch, '/users'),
      repos = yield call(fetch, '/repos')
```

Because the 2nd effect will not get executed until the first call resolves. Instead we have to write:

```javascript
import { call } from 'redux-saga/effects'

// correct, effects will get executed in parallel
const [users, repos]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repos')
]
```

When we yield an array of effects, the generator is blocked until all the effects are resolved or as soon as one is rejected (just like how `Promise.all` behaves).
