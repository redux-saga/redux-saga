#Effect Combinators

The `yield` statement is great for representing asynchronous control flow in a simple and linear
style, but we also need to do things in parallel. We can't simply write:

```javascript
// Wrong, effects will be executed in sequence
const users  = yield call(fetch, '/users'),
      repos = yield call(fetch, '/repos')
```

Because the 2nd effect will not get executed until the first call resolves. Instead we have to write:

```javascript
import { call } from 'redux-saga'

// correct, effects will get executed in parallel
const [users, repose]  = yield [
  call(fetch, '/users'),
  call(fetch, '/repos')
]
```

When we yield an array of effects, the generator is blocked until all the effects are resolved (or as soon as
one is rejected, just like how `Promise.all` behaves).

Sometimes we start multiple tasks in parallel but we don't want to wait for all of them, we just need
to get the *winner*: the first one that resolves (or rejects). The `race` function offers a way of
triggering a race between multiple effects.

The following sample shows a Saga that triggers a remote fetch request, and constrain the response with a
1 second timeout.

```javascript
import { race, take, put } from 'redux-saga'

function* fetchPostsWithTimeout() {
  while( yield take(FETCH_POSTS) ) {
    // starts a race between 2 effects
    const {posts, timeout} = yield race({
      posts   : call(fetchApi, '/posts'),
      timeout : call(delay, 1000)
    })

    if(posts)
      put( actions.receivePosts(posts) )
    else
      put( actions.timeoutError() )
  }
}
```
