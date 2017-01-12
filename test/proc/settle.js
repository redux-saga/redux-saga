import test from 'tape';
import { END } from '../../src'
import proc from '../../src/internal/proc'
import { deferred, arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/effects'

test('processor settle array of effects handling', assert => {
  assert.plan(1);

  let actual;
  const def = deferred()

  let cpsCb = {}
  const cps = (val, cb) => cpsCb = {val, cb}

  const input = cb => {
    Promise.resolve(1)
      .then(() => def.resolve(1))
      .then(() => cpsCb.cb(null, cpsCb.val))
      .then(() => cb({type: 'action'}))
    return () => {}
  }

  function* genFn() {
    actual = yield io.settle([
      def.promise,
      io.cps(cps, 2),
      io.take('action')
    ])
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [
      {isError: false, result: 1},
      {isError: false, result: 2},
      {isError: false, result: {type: 'action'}}
  ];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must settle parallel effects"
    );
    assert.end();
  })

});

test('processor settle array of effect: handling errors', assert => {
  assert.plan(1);

  let actual;
  const defs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => defs[0].reject('error'))
    .then(() => defs[1].resolve(1))

  function* genFn() {
    actual = yield io.settle([
      defs[0].promise,
      defs[1].promise
    ])
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = [
      {isError: true, result: 'error'},
      {isError: false, result: 1}
  ];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must finish running and report error after completion when error occurs "
    );
    assert.end();
  })

});

test('processor settle empty array', assert => {
  assert.plan(1);

  let actual;

  const input = () => {
    return () => {}
  }

  function* genFn() {
    actual = yield io.settle([])
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill empty parallel effects with an empty array"
    );
    assert.end();
  })

});

test('processor settle array of effect: handling END', assert => {
  assert.plan(1);

  let actual;
  const def = deferred()
  const input = (cb) => {
    Promise.resolve(1)
      .then(() => def.resolve(1))
      .then(() => cb(END))

    return () => {}
  }



  function* genFn() {
    try {
      actual = yield [
        def.promise,
        io.take('action')
      ]
    } finally {
      actual = 'end'
    }

  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  setTimeout(() => {
    assert.deepEqual(actual, 'end',
      "processor must end Settle Effect if one of the effects resolve with END"
    );
    assert.end();
  })

});
