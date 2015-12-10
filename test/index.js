import test from 'tape';
import sagaMiddleware, { nextAction } from '../src'
import { SAGA_ARGUMENT_ERROR } from '../src/constants'

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

test('sagaMiddleware -> action handler -> saga generator output', assert => {
  assert.plan(1);

  try {
    sagaMiddleware(() => {});
  } catch(error) {
    assert.equal(error.message, SAGA_ARGUMENT_ERROR, 'sagaMiddleware must throw if not provided with a Generator function' );
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

  const action1 = { type: "action1" }
  const action2 = { type: "action2" }

  let actual = [];

  function* saga(getState) {
    actual.push(getState)
    yield 1;
  }

  const dispatch = sagaMiddleware(saga)(middlewareParams)(action => action);
  actual.push(dispatch(anAction))

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

test('sagaMiddleware -> action handler -> generator iteration -> wait for actions', assert => {
  assert.plan(1);

  let actual = [];

  function* saga(getState) {
    actual.push( yield nextAction() )
    actual.push( yield nextAction('action-1') )
    actual.push( yield nextAction('action-2', 'action-2222') )
    actual.push( yield nextAction('action-2222') )
  }

  const dispatch = sagaMiddleware(saga)(middlewareParams)(action => action);
  Promise.resolve(1)
    .then(() => dispatch({type: 'action-*'}))
    .then(() => dispatch({type: 'action-1'}))
    .then(() => dispatch({type: 'action-2'}))
    .then(() => dispatch({type: 'action-3'}))

  const expected = [{type: 'action-*'}, {type: 'action-1'}, {type: 'action-2'}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "Generator iterator must wait for matching actions when yielding nextAction(pattern)"
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
