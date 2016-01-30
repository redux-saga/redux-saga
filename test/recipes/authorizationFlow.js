/* eslint-disable no-constant-condition */

import test from 'tape';
import sagaMiddleware, { take, put, call, race, SagaCancellationException } from '../../src'
import { createStore, applyMiddleware } from 'redux'

/**
  Purpose:
    Handling a complete authorization Flow

  Description of the flow:
    - Wait for a LOGIN_REQUEST action
    - authorize on a remote service with the provided credentials (cancel if LOGOUT)
        - if authorization succeeds
            - triggers an LOGIN_REQUEST actions
            - extract authorization token from the response inside `token`
            - refresh authorization every token.expires_in time (cancel if LOGOUT)
        - if authorization fails
            - triggers a LOGIN_ERROR action
            - wait for the next LOGIN_REQUEST action

  Test:
    We fire 3 consecutive tasks concurrently
    We resolve the end results after some delay with an aribitary order

  Expected results
    Since the 3 tasks are fired concurrently, we should only
    get the result of the latest fired task
**/


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

////////////////////////////////////////////////////////////////
// API mocks
//

// big enough to have predictable results
const TOKEN_TIMEOUT = 50

function apify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      try {
        resolve(fn(...args))
      } catch(e) {
        reject(e)
      }
    })
  }
}

const users = [
  {name: 'admin', password: 'admin'},
  {name: 'guest', password: 'guest'}
]


function createToken(id) {
  return {expires_in: TOKEN_TIMEOUT, id , $$token: true}
}

let tokenId = 0
function authFn({token, name, password}) {
  if(token) {
    return refreshTokenFn(token)
  }

  else {
    const valid = users.some(
      u => u.name === name && u.password === password
    )

    if(valid)
      return createToken(++tokenId)
    else
      throw 'Invalid credentials'
  }
}

function refreshTokenFn(token) {
  if(!token.$$token)
    throw 'Invalid token'
  return {...token, id: ++tokenId}
}

const api = {
  authorize: apify(authFn),
  refreshToken: apify(refreshTokenFn)
}

test('Recipes: authorization flow', assert => {

  assert.plan(1)


  ///////////////////////////////////////////////////////////////
  // Actions
  //

  const login = {
    request : (name, password) => ({type: 'LOGIN_REQUEST', name, password}),
    success : (token) => ({type: 'LOGIN_SUCCESS', token}),
    error   : (error) => ({type: 'LOGIN_ERROR', error})
  }

  const logout = () => ({type: 'LOGOUT'})


  ///////////////////////////////////////////////////////////////
  //
  // Sagas
  //

  function* authorize(credentials) {
    const token = yield call(api.authorize, credentials)
    yield put( login.success(token) )
    return token
  }

  function* authAndRefreshTokenOnExpiry(name, password) {
    try {
      let token = yield call(authorize, {name, password})
      while(true) {
        yield call(delay, token.expires_in)
        token = yield call(authorize, {token})
      }
    } catch(err) {
      if(err instanceof SagaCancellationException)
        actual.push('refresh cancelled')
      else
        throw err
    }
  }

  function* watchAuth() {
    while(true) {
      try {
        const {name, password} = yield take('LOGIN_REQUEST')

        yield race({
          logout: take('LOGOUT'),
          auth: call(authAndRefreshTokenOnExpiry, name, password)
        })
      } catch(error) {
        yield put( login.error(error.auth) )
      }
    }
  }

  const sagas = [watchAuth]

  const actual = []
  const expected =  [
    { type: '@@redux/INIT' },

    { type: 'LOGIN_REQUEST', name: 'adminee', password: 'admin'},
    { type: 'LOGIN_ERROR', error: 'Invalid credentials' },

    { type: 'LOGIN_REQUEST', name: 'admin', password: 'admin'},
    { type: 'LOGIN_SUCCESS', token: createToken(1) },
    { type: 'LOGIN_SUCCESS', token: createToken(2) },
    { type: 'LOGIN_SUCCESS', token: createToken(3) },
    { type: 'LOGOUT' },
    'refresh cancelled'
  ]

  const finalCreateStore = applyMiddleware(sagaMiddleware(...sagas))(createStore)
  const store = finalCreateStore((state, action) => actual.push(action))

  // simulate a failed login
  store.dispatch(login.request('adminee', 'admin'))

  // now a successful login
  setTimeout(() => {
    store.dispatch(login.request('admin', 'admin'))
  })

  setTimeout(() => {
    store.dispatch(logout())

    assert.deepEqual(actual, expected,
      'authorization flow test must record the correct sequence of actions'
    )
  }, 125 /* allows 1 login + 2 refreshes  */)



})
