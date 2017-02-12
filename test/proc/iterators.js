import test from 'tape';
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import { arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/effects'

test('processor nested iterator handling', assert => {
  assert.plan(1);

  let actual = [];
  let defs = arrayOfDeffered(3)

  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* child() {
    actual.push( yield defs[0].promise )
    actual.push(yield io.take('action-1'))

    actual.push( yield defs[1].promise )
    actual.push(yield io.take('action-2'))

    actual.push( yield defs[2].promise )
    actual.push( yield io.take('action-3') )

    actual.push( yield Promise.reject('child error') )
  }

  function* main() {
    try {
      yield child()
    } catch (e) {
      actual.push('caught ' + e)
    }
  }
  const expected = [1, {type: 'action-1'}, 2, {type: 'action-2'}, 3, {type: 'action-3'}, 'caught child error'];

  const task = middleware.run(main)

  Promise.resolve(1)
    .then(() => defs[0].resolve(1))
    .then(() => store.dispatch({type: 'action-1'}))
    .then(() => defs[1].resolve(2))
    .then(() => store.dispatch({type: 'action-2'}))
    .then(() => defs[2].resolve(3))
    .then(() => store.dispatch({type: 'action-3'}))

  task.done
    .then(() => {
      assert.deepEqual(actual, expected,
        "processor must fullfill nested iterator effects"
      );
      assert.end();
    })
    .catch(err => assert.fail(err))
});
