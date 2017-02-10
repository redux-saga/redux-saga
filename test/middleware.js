import test from 'tape'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../src'
import { is } from '../src/utils'
import { takeEvery } from '../src/effects'

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

test('middleware options', assert => {
  try {
    sagaMiddleware({ onError: 42 })
  } catch (e) {
    assert.equal(e.message, '`options.onError` passed to the Saga middleware is not a function!', 'middleware factory must raise an error if `options.onError` is not a function')
  }

  try {
    sagaMiddleware({ onerror: '42' })
  } catch (e) {
    assert.equal(e.message, '`options.onError` passed to the Saga middleware is not a function!', 'middleware factory must raise an error if `options.onerror` is not a function')
  }

  const fn = () => {}
  const options = { onerror: fn }
  sagaMiddleware(options)
  assert.ok(typeof options.onerror === 'undefined', '`options.onerror` must be deleted')
  assert.ok(options.onError === fn, '`options.onError` has a function moved from `options.onerror`')

  assert.end()
})

test('middleware\'s custom emitter', assert => {
  const actual = []

  function* saga() {
    yield takeEvery('*', ac => actual.push(ac.type))
  }

  const middleware = sagaMiddleware({
    emitter: emit => action => {
      if (action.type === 'batch') {
        action.batch.forEach(emit)
        return
      }
      emit(action)
    }
  })

  const store = createStore(()=>{}, applyMiddleware(middleware))
  middleware.run(saga)

  store.dispatch({ type: 'a' })
  store.dispatch({
    type: 'batch',
    batch: [{ type: 'b' }, { type: 'c' }, { type: 'd' }]
  })
  store.dispatch({ type: 'e' })

  const expected = ['a', 'b', 'c', 'd', 'e']

  assert.deepEqual(actual, expected,
    'saga must be able to take actions emitted by middleware\'s custom emitter'
  )

  assert.end()
});
