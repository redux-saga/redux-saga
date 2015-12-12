
import test from 'tape';
import sagaMiddleware from '../src'

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
