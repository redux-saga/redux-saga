import test from 'tape';
import sagaMiddleware, { SAGA_ARGUMENT_ERROR } from '../src'

const DELAY = 50;
const aState = { state: 'state'};
const anAction = {type: 'action'};
const nextMiddleware = action => action;
const getStateFn = () => aState;
const dispatchFn = action => {};
const emptySaga = function*() {}
const middlewareParams = {
  getState: getStateFn,
  dispatch: dispatchFn
};


test('sagaMiddleware -> output', assert => {

  const middleware = sagaMiddleware(emptySaga);

  assert.equal(typeof middleware, 'function',
    'middleware factory must return a function to handle {getState, dispatch}');

  assert.equal(middleware.length, 1,
    'middleware returned function must take exactly 1 argument');

  const nextHandler = middleware(middlewareParams);

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


test('sagaMiddleware -> action handler -> output', assert => {
  const actionHandler = sagaMiddleware(emptySaga)(middlewareParams)(action => action);

  assert.equal(actionHandler(anAction), anAction,
    'action handler must return the result of the next argument');

  assert.end();
});

test('sagaMiddleware -> action handler -> call sequence (next, saga, return next result)', assert => {
  assert.plan(2);

  let actual = [] // array to hold results of successive calls
  const expected = [
    {next: anAction},
    {saga: {getState: getStateFn, action: anAction}}
  ];

  const next = action => {
    actual.push({next: action});
    return action;
  };

  const saga = function*(getState, action) {
    actual.push({saga: {getState, action}});
  }

  const actionHandler = sagaMiddleware(saga)(middlewareParams)(next);

  assert.equal(actionHandler(anAction), anAction,
    'action handler must return the result of the next argument');


  assert.deepEqual(actual, expected,
    'action handler must call next(action) then saga({getState, action})'
  )

  assert.end();
});

test('sagaMiddleware -> action handler -> saga generator output', assert => {
  assert.plan(1);

  try {
    sagaMiddleware({});
  } catch(error) {
    assert.equal(error.message, SAGA_ARGUMENT_ERROR);
  }

  try {
    sagaMiddleware(function*() {});
  } catch(error) {
    assert.fail("sagaMiddleware must not throw if provided with a Generator function");
  }

  assert.end();

});

test('sagaMiddleware -> action handler -> generator iteration', assert => {
  assert.plan(1);

  let actual = [];

  function* saga(getState, action) {
    actual.push(getState)
    yield;

    actual.push(action);
    yield;
  }

  sagaMiddleware(saga)(middlewareParams)(action => action)(anAction);

  const expected = [getStateFn, anAction];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "action handler must iterate on the saga Generator"
    );
    assert.end();
  }, DELAY)

});


test('sagaMiddleware -> action handler -> generator iteration -> handle actions', assert => {
  assert.plan(1);

  let actual = [];
  const dispatch = action => {
    actual.push(action);
    return action.count + 1;
  }

  function* saga(getState, action) {
    const count1 = (yield {count: 0}) * 10;
    const count2 = (yield { count: count1}) * 10;
    yield { count: count2 };
  }

  sagaMiddleware(saga)({getState: getStateFn, dispatch})(action => action)(anAction);

  const expected = [{count: 0}, {count: 10}, {count: 110}];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "Generator iterator must dispatch actions and returns the dispatch result"
    );
    assert.end();
  }, DELAY)

});

test('sagaMiddleware -> action handler -> generator iteration -> handle effects of [fn, ...args]', assert => {
  assert.plan(1);

  let actual = [];
  const api = arg => Promise.resolve(1).then(() => {
    actual.push(arg);
    return arg.count + 1;
  });

  const dispatch = action => {
    actual.push(action);
    return action.count;
  }

  function* saga(getState, action) {
    const count1 = (yield [api, {count: 0}]) * 10;
    const count2 = (yield [api, {count: count1}]) * 10;
    yield { count: count2 };
  }

  sagaMiddleware(saga)({getState: getStateFn, dispatch})(action => action)(anAction);

  const expected = [{count: 0}, {count: 10}, {count: 110}];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "Generator iterator must execute side effects [fn, ...args] and return the resolved result"
    );
    assert.end();
  }, DELAY)

});

test('sagaMiddleware -> action handler -> generator iteration -> handle thunks', assert => {
  assert.plan(1);

  let actual = [];
  const api = arg => () => Promise.resolve(1).then(() => {
    actual.push(arg);
    return arg.count + 1;
  });

  const dispatch = action => {
    actual.push(action);
    return action.count;
  }

  function* saga(getState, action) {
    const count1 = (yield api({count: 0})) * 10;
    const count2 = (yield api({count: count1})) * 10;
    yield { count: count2 };
  }

  sagaMiddleware(saga)({getState: getStateFn, dispatch})(action => action)(anAction);

  const expected = [{count: 0}, {count: 10}, {count: 110}];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "Generator iterator must execute thunks and return the resolved result"
    );
    assert.end();
  }, DELAY)

});

test('sagaMiddleware -> action handler -> generator iteration -> throw errors', assert => {
  assert.plan(1);

  let actual = [];
  const api = arg => new Promise((resolve, reject) => {
    actual.push(arg)
    reject(`error ${arg.count}`);
  })

  const dispatch = action => {
    actual.push(action);
    return action.count;
  }

  function* saga(getState, action) {
    try {
      yield [api, {count: 0}];
    } catch (error) {
      yield {error};
    }
  }

  sagaMiddleware(saga)({getState: getStateFn, dispatch})(action => action)(anAction);

  const expected = [{count: 0}, {error: "error 0"}];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "Generator iterator must throw errors from rejected promises"
    );
    assert.end();
  }, DELAY)

});
