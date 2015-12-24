## Handling Authorization flow

>[Original issue](https://github.com/yelouafi/redux-saga/issues/14)

First, I dont recommend calling service directly within sagas, it'd be better to use declarative calls. It makes possible testing all the operational logic inside the generator as explained in [the declarative effects section](https://github.com/yelouafi/redux-saga#declarative-effects)

So I'll first refactor localStorage calls into some isolated service

```javascript
// Side effects Services
function getAuthToken() {
  return JSON.parse(localStorage.getItem('authToken'))
}

function setAuthToken(token) {
  localStorage.setItem('authToken', JSON.stringify(token))
}

function removeAuthToken() {
  localStorage.removeItem('authToken')
}
```

Another remark is regarding action watching flow. It'd be easier if you exploit the Structured programming benefits offered by generators. I'll illustrate with a simple example, suppose our flow is just this simple sequence

```
SIGN_IN -> AUTHORIZE -> SIGN_OUT
```  

Instead of doing something like
```javascript
while(true) {
  const action = take([SIGN_IN, SIGN_OUT])

  if(action.type === SIGN_IN)
     const token = yield call(authorize)
     yield call(setAuthToken) // save to local storage
     yield put(authSuccess, token)
  else
     yield call(removeAuthToken)
     yield put(signout)
  }
}
```

You can exploit the fact that SIGN_IN and SIGN_OUT fire always in sequence and never concurrently and offload the flow control burden (where are we in the program right now ?) to the underlying generator runtime  (I simplify to illustrate the concept, I ll introduce concurrency next)

```javascript
function* authFlowSaga() {
  while(true) {
    // first expect a SIGN_IN
    const {credentials} = yield take(SIGN_IN)
    const token = yield call(authorize, credentials)
    
    // followed by a SIGN_OUT
    yield take(SIGN_OUT)
    yield call(signout)
  }
}

// reusable subroutines. Avoid duplicating code inside the main Saga
function* authorize(credentialsOrToken) {
  // call the remote authorization service
  const token = yield call(authService, credentialsOrToken)
  yield call(setAuthToken, token) // save to local storage
  yield put(authSuccess, token) // notify the store
  return token
}

function* signout(error) {
  yield call(removeAuthToken) // remove the token from localStorage
  yield put( actions.signout(error)  ) // notify th store
}
```

Before introducing concurrency, let's first introduce the refresh cycles, when the token expires w'll send again a request to the server to get a new token. so our sequence will become now

```
SIGN_IN -> AUTHORIZE -> REFRESH* -> SIGN_OUT
```
REFRESH* means many refreshes i.e. a loop in the generator

We're still forgetting concurrency to keep things simple and progress step by step

```javascript
function* authFlowSaga() {
  while(true) {
    const {credentials} = yield take(SIGN_IN)
    let token = yield call(authorize, credentials)

    // refresh authorization tokens on expiration
    while(true) {
      yield wait(token.expires_in)
      token = call(authorize, token)
    }
    
    yield take(SIGN_OUT)
    yield call(signout)
  }
}
```

But we've an issue there, the refresh loop executes forever, because there is no breaking condition. If the user signed out between 2 refreshes we've to break the loop. So the breaking condition is the SIGN_OUT action. Also the SIGN_OUT action is *concurrent* to the next expiration delay, So we have to introduce a `race` between the 2 events

```javascript
function* authFlowSaga() {
  while(true) {
    const {credentials} = yield take(SIGN_IN)
    let token = yield call(authorize, credentials)

    let userSignedOut
    while( !userSignedOut ) {
      const {expired} = yield race({
        expired : wait(token.expires_in),
        signout : take(SIGN_OUT)
      })

      // token expired first
      if(expired)
        token = yield call(authorize, token)
      // user signed out before token expiration
      else {
        userSignedOut = true // breaks the loop and wait for SIGN_IN again
        yield call(signout)
      }
    }
  }
}
```

But there are 2 othe issues, first the `authorize` saga may fail if the remote server responded with an error (e.g. invalid credentials, network error ...). And second, there is another concurrency issue, what if the user signed out in the middle of a refresh request/response cycle ? We'd have to cancel the ongoing authorization operation.

So first, we've to refactor our `authorize` saga

```javascript
function* authorize(credentialsOrToken) {
  const {response} = yield race({
    response: call(authService, credentialsOrToken), 
    signout : take(SIGN_OUT)
  })

  // server responded (with Success) before user signed out
  if(response && response.token) {
    yield call(setAuthToken, response.token) // save to local storage
    yield put(authSuccess, response.token)
    return response.token
  } 
  // user signed out before server response OR server responded first but with error
  else {
    yield call(signout, response ? response.error : 'User signed out')
    return null
  }
}
```

Now if a remote authorization fails, we signout the user and return null as token. So we've also to refactor our main Saga to take into account the failure (null return value)

```javascript
function* authFlowSaga() {
  while(true) {
    const {credentials} = yield take(SIGN_IN)
    let token = yield call(authorize, credentials)
    // authorization failed, wait the next signing
    if(!token) 
        continue

    let userSignedOut
    while( !userSignedOut ) {
      const {expired} = yield race({
        expired : wait(token.expires_in),
        signout : take(SIGN_OUT)
      })

      // token expired first
      if(expired) {
        token = yield call(authorize, token)
        // authorization failed, either by the server or the user signout
        if(!token) {
          userSignedOut = true // breaks the loop
          yield call(signout)
        }
      } 
      // user signed out before token expiration
      else {
        userSignedOut = true // breaks the loop
        yield call(signout)
      }
    }
  }
}
```

Now, we can think of the left requirement. What if there is a token already in local storage ? We'll simply skip the `take(SIGN_IN)` step and refresh immerdiately


```javascript
function* authFlowSaga() {

  let token = yield call(getAuthToken) // retreive from local storage
  token.expires_in = 0
  
  while(true) {
    if(!token) {
      let {credentials} = yield take(SIGN_IN)
      token = yield call(authorize, credentials)
    }

   // ... rest pf code unchanged
}
```

So IMO we should follow as much as we can the following

- isolate side effects functions (api calls, dom storage, ...) into separate services. This includes JSON.parse or stringify, or also wrapping api call results into {result} or {errors}

- implement your flow step by step, starting by the simplest assumptions, then progressively introduce more requirements (concurrency, failure). The code will emerge naturally from this iterative process.

- follow the Structured Programming approach. An `if` test makes only sens if we're waiting for concurrent effects (using `race`) or conditional results (success or error)

- Your code flow should reflect closely the corresponding flow of events. If you know 2 events will fire in sequence (e.g. `SIGN_IN` then `SIGN_OUT`) then write 2 consecutive takes (`take(SIGN_IN)` then `take(SIGN_OUT)`). Use `race` only if there are concurrent events.

As I said, the main benefit of using Generators is that it allows to leverage the power of Structured Programming and routine/subroutine approach. do you think that humans could write such complex programs using only goto jumps ?
