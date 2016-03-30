
import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../src'
import { is } from '../src/utils'

test('middleware output', assert => {


  const middleware = sagaMiddleware();

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
  const actionHandler = sagaMiddleware()({})(action => action);

  assert.equal(actionHandler(action), action,
    'action handler must return the result of the next argument');

  assert.end();
});

test('middleware.run', assert => {

  let actual

  function* saga(...args) {
    actual = args
  }

  const middleware = sagaMiddleware()

  try {
    middleware.run(function* () {})
  } catch (e) {
    assert.ok(e instanceof Error, 'middleware.run must throw an Error when executed before the middleware is connected to a Store')
  }

  createStore(()=>{}, applyMiddleware(middleware))
  const task = middleware.run(saga, 'argument')

  assert.ok(is.task(task), 'middleware.run must return a Task Object')

  const expected = ['argument']
  assert.deepEqual(actual, expected,
    'middleware must run the Saga and provides it with the given arguments'
  )

  assert.end()
})
