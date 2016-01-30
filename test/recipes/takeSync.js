/* eslint-disable no-unused-vars, no-constant-condition */

import test from 'tape';
import sagaMiddleware, { take, put, fork, join, call, race, cancel } from '../../src'
import { createStore, applyMiddleware } from 'redux'


test('synchronous take handling', assert => {
  assert.plan(1);

  const actual = []
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})

  function* fnA() {
    actual.push( yield take('a1') )
    actual.push( yield take('a3') )
  }

  function* fnB() {
    actual.push( yield take('a2') )
  }

  function* root() {
    yield fork(fnA)
    yield fork(fnB)
  }

  store.dispatch({type: 'a1'})
  store.dispatch({type: 'a2'})
  store.dispatch({type: 'a3'})

  assert.deepEqual(actual, [{type: 'a1'}, {type: 'a2'}, {type: 'a3'}],
    "Sagas must take consecutive actions dispatched synchronously"
  );
  assert.end();

});

test('concurrent take handling of synchronous actions', assert => {
  assert.plan(1);

  const actual = []
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})

  /**
    This is surely an edge case, but we want be sure the implementation follow the
    desired semantics:

    The race effect has 2 concurrent takes, the store dispatches the 2 actions
    synchronously. Below the 'a1' take wins first (no ES6 standard for object keys traversal
    order but actual implementations tends to respect the order in which the keys were
    declared, otherwise this will be an ambiguous result)

    If a1 wins, then a2 cancellation means it will not take 'a2' action, dispatched
    immediately by the store after 'a1'; so the 2n take('a2') should take it
  **/

  function* root() {
    actual.push(yield race({
      a1: take('a1'),
      a2: take('a2')
    }))

    actual.push( yield take('a2') )
  }

  store.dispatch({type: 'a1'})
  store.dispatch({type: 'a2'})

  assert.deepEqual(actual, [{ a1: {type: 'a1'} }, {type: 'a2'}],
    "In concurrent takes only the winner must take an action"
  );
  assert.end();

});

test('parallel take handling of synchronous actions', assert => {
  assert.plan(1);

  const actual = []
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})

  function* root() {
    actual.push(yield [
      take('a1'),
      take('a2')
    ])
  }

  store.dispatch({type: 'a1'})
  store.dispatch({type: 'a2'})

  setTimeout(() => {
    assert.deepEqual(actual, [],
      "parallel takes are not allowed (and meaningless)"
    );
    assert.end();
  })

});


// see https://github.com/yelouafi/redux-saga/issues/50
test('inter-saga put/take handling', assert => {
  assert.plan(1);

  function* fnA() {
    while(true) {
      let {payload} = yield take('a')
      yield fork(someAction, payload)
    }
  }

  function* fnB() {
    yield put({type: 'a', payload: 1})
    yield put({type: 'a', payload: 2})
    yield put({type: 'a', payload: 3})
  }

  function* someAction(payload) {
    actual.push(payload)
  }

  function* root() {
    yield [
      fork(fnA),
      fork(fnB)
    ]
  }

  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})
  const actual = []

  setTimeout(() => {
    assert.deepEqual(actual, [1,2,3],
      "Sagas must take actins from each other"
    );
    assert.end();
  }, 0)

});

test('inter-saga send/aknowledge handling', assert => {
  assert.plan(1);

  const actual = []
  const push = ({type}) => actual.push(type)
  const store = applyMiddleware(sagaMiddleware(root))(createStore)(() => {})


  function* fnA() {
    push( yield take('msg-1') )
    yield put({type: 'ack-1'})
    push( yield take('msg-2') )
    yield put({type: 'ack-2'})
  }

  function* fnB() {
    yield put({type: 'msg-1'})
    push( yield take('ack-1') )
    yield put({type: 'msg-2'})
    push( yield take('ack-2') )
  }

  function* root() {
    yield [
      fork(fnA),
      fork(fnB)
    ]
  }



  setTimeout(() => {
    assert.deepEqual(actual, ['msg-1', 'ack-1', 'msg-2', 'ack-2'],
      "Sagas must take actions from each other in the right order"
    );
    assert.end();
  }, 0)

});
