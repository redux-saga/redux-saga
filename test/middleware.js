
import test from 'tape'
import { createStore, applyMiddleware } from 'redux'

import sagaMiddleware from '../src'
import { take, put } from '../src/effects'

test('middleware output', assert => {

  const middleware = sagaMiddleware(function*() {});

  assert.equal(typeof middleware, 'function',
    'middleware factory must return a function to handle {getState, dispatch}');

  assert.equal(middleware.length, 1,
    'middleware returned function must take exactly 1 argument');

  const nextHandler = middleware({});

  assert.equal(typeof nextHandler, 'function',
    'next handler must return a function to handle action');

  assert.equal(nextHandler.length, 1,
    'next handler must take exactly 1 argument');

  const actionHandler = nextHandler();

  assert.equal(typeof actionHandler, 'function',
    'next handler must return a function to handle action');

  assert.equal(actionHandler.length, 1,
    'action handler must take exactly 1 argument');


  assert.end();
});

test('middleware\'s action handler output', assert => {

  const action = {};
  const actionHandler = sagaMiddleware(function*() {})({})(action => action);

  assert.equal(actionHandler(action), action,
    'action handler must return the result of the next argument');

  assert.end();
});

test('middleware.run', assert => {
  assert.plan(1)

  let actual = []

  function* middlewareGen() {
    actual.push( yield take('RUN_SAGA_ACTION') )
    yield put({type: 'MIDDLEWARE_ACTION'})
  }


  function* runGen() {
    actual.push( yield take('STORE_ACTION') )
    yield put({type: 'RUN_SAGA_ACTION'})
    actual.push( yield take('MIDDLEWARE_ACTION') )
  }

  const middleware = sagaMiddleware(middlewareGen)
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(runGen)

  const expected = [
    {type: 'STORE_ACTION'},
    {type: 'RUN_SAGA_ACTION'},
    {type: 'MIDDLEWARE_ACTION'}
  ]

  Promise.resolve(1)
    .then(() => store.dispatch({type: 'STORE_ACTION'}))

  setTimeout(() =>
    assert.deepEqual(actual, expected,
      'dynamically ran Saga must take actions from startup Sagas'
    )
  )
})
