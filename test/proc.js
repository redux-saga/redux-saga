import test from 'tape';
import proc, { NOT_ITERATOR_ERROR } from '../src/proc'
import { is } from '../src/utils'
import * as io from '../src/io'
import { deferred, arrayOfDeffered } from './utils'

const DELAY = 50

test('processor iteration', assert => {
  assert.plan(4)

  let actual = []

  function* genFn() {
    actual.push( yield 1 )
    actual.push( yield 2 )
    return 3
  }

  const iterator = genFn()
  const endP = proc(iterator).catch(err => assert.fail(err))
  assert.equal(iterator._isRunning, true,
    'processor\'s iterator should have _isRunning = true'
  )
  assert.equal(is.promise(endP), true,
  'processor should return a promise of the iterator result'
  )
  endP.then((res) => {
    assert.equal(res, 3,
      'processor returned promise should resolve with the iterator return value'
    )
    assert.deepEqual(actual, [1,2],
      'processor should collect yielded values from the iterator'
    )
  })

})

/* TODO check that promis result is rejected when the generator throws an error */

test('processor input', assert => {
  assert.plan(1)

  try {
    proc({})
  } catch(error) {
    assert.equal(error.message, NOT_ITERATOR_ERROR,
      'processor must throw if not provided with an iterator'
    )
  }

  try {
    proc((function*() {})())
  } catch(error) {
    assert.fail("processor must not throw if provided with an iterable")
  }

  assert.end()

})

test('processor output handling', assert => {
  assert.plan(1)

  let actual = []
  const dispatch = v => actual.push(v)

  function* genFn(arg) {
    yield io.put(arg)
    yield io.put(2)
  }

  proc(genFn('arg'), undefined, dispatch).catch(err => assert.fail(err))

  const expected = ['arg', 2];
  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must handle generator output"
    );
    assert.end();
  }, DELAY)

});

test('processor promise handling', assert => {
  assert.plan(1);

  let actual = [];
  const defs = arrayOfDeffered(2)
  Promise.resolve(1)
    .then(() => defs[0].resolve(1))
    .then(() => defs[1].resolve(2))

  function* genFn() {
    actual.push(yield defs[0].promise)
    actual.push(yield defs[1].promise)
  }

  proc(genFn()).catch(err => assert.fail(err))

  const expected = [1,2];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill promises effects"
    );
    assert.end();
  }, DELAY)

});

test('processor declarative call handling', assert => {
  assert.plan(1);

  let actual = [];
  function func(arg) {
    return Promise.resolve(arg)
  }

  function* subGen(io, arg) {
    yield Promise.resolve(1)
    return arg
  }

  function* genFn() {
    actual.push( yield io.call(func, 1)  )
    actual.push( yield io.call(subGen, io, 2)  )
  }

  proc(genFn()).catch(err => assert.fail(err))

  const expected = [1, 2];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill declarative call effects"
    );
    assert.end();
  }, DELAY)

});



test('processor input handling', assert => {
  assert.plan(1);

  let actual = [];
  const input = (cb) => {
    Promise.resolve(1)
      .then(() => cb({type: 'action-*'}))
      .then(() => cb({type: 'action-1'}))
      .then(() => cb({type: 'action-2'}))
      .then(() => cb({isAction: true}))
      .then(() => cb({type: 'action-3'}))
    return () => {}
  }

  function* genFn() {
    actual.push( yield io.take() )
    actual.push( yield io.take('action-1') )
    actual.push( yield io.take('action-2', 'action-2222') )
    actual.push( yield io.take(a => a.isAction) )
    actual.push( yield io.take('action-2222') )
  }

  proc(genFn(), input).catch(err => assert.fail(err))

  const expected = [{type: 'action-*'}, {type: 'action-1'}, {type: 'action-2'}, {isAction: true}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill input queries from the generator"
    );
    assert.end();
  }, DELAY)

});

test('processor cps call handling', assert => {
  assert.plan(1);

  let actual = [];

  function* genFn() {
    try {
      yield io.cps(cb => {
        actual.push('call 1');
        cb('err')
      })
      actual.push('call 2')
    } catch(err) {
      actual.push('call ' + err)
    }
  }

  proc(genFn()).catch(err => assert.fail(err))

  const expected = ['call 1', 'call err'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill cps call effects"
    );
    assert.end();
  }, DELAY)

});

test('processor array of effects handling', assert => {
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
    actual = yield [
      def.promise,
      io.cps(cps, 2),
      io.take('action')
    ]
  }

  proc(genFn(), input).catch(err => assert.fail(err))

  const expected = [1,2, {type: 'action'}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill parallel effects"
    );
    assert.end();
  }, DELAY)

});

/* TODO test that a failed promise inside the array throws an exception inside the Generator */
test('processor array of effect: handling errors', assert => {
  assert.plan(1);

  let actual;
  const defs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => defs[0].reject('error'))
    .then(() => defs[1].resolve(1))

  function* genFn() {
    try {
      actual = yield [
        defs[0].promise,
        defs[1].promise
      ]
    } catch(err) {
      actual = [err]
    }
  }

  proc(genFn()).catch(err => assert.fail(err))

  const expected = ['error'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must catch the first error in parallel effects"
    );
    assert.end();
  }, DELAY)

});

test('processor race between effects handling', assert => {
  assert.plan(1);

  let actual = [];
  const timeout = deferred()
  const input = cb => {
    Promise.resolve(1)
      .then(() => timeout.resolve(1) )
      .then(() => cb({type: 'action'}))
    return () => {}
  }

  function* genFn() {
    actual.push( yield io.race({
      event: io.take('action'),
      timeout: timeout.promise
    }) )
  }

  proc(genFn(), input).catch(err => assert.fail(err))

  const expected = [{timeout: 1}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill race between effects"
    );
    assert.end();
  }, DELAY)

});

test('processor nested iterator handling', assert => {
  assert.plan(1);

  let actual = [];
  let defs = arrayOfDeffered(3)

  const input = cb => {
    Promise.resolve(1)
      .then(() => defs[0].resolve(1))
      .then(() => cb({type: 'action-1'}))
      .then(() => defs[1].resolve(2))
      .then(() => cb({type: 'action-2'}))
      .then(() => defs[2].resolve(3))
      .then(() => cb({type: 'action-3'}))
    return () => {}
  }

  function* child() {
    actual.push( yield defs[0].promise )
    actual.push(yield io.take('action-1'))

    actual.push( yield defs[1].promise )
    actual.push(yield io.take('action-2'))

    actual.push( yield defs[2].promise )
    actual.push( yield io.take('action-3') )
  }

  function* main() {
    yield child()
  }

  proc(main(), input).catch(err => assert.fail(err))

  const expected = [1, {type: 'action-1'}, 2, {type: 'action-2'}, 3, {type: 'action-3'}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill nested iterator effects"
    );
    assert.end();
  }, DELAY)

});

test('processor fork handling: return a task', assert => {
  assert.plan(5);

  let task;

  function* subGen(arg) {
    yield Promise.resolve(1)
    return arg
  }

  function* genFn() {
    task = yield io.fork(subGen, 1)
  }

  proc(genFn(),).catch(err => assert.fail(err))

  setTimeout(() => {

    assert.equal(task.name, 'subGen',
      'fork result must include the name of the forked generator function'
    ),
    assert.equal(task._generator, subGen,
      'fork result must include the forked generator function'
    ),
    assert.equal(!!task._iterator, true,
      'fork result must include the iterator resultinh from running the forked generator function'
    ),
    assert.equal(is.promise(task._done), true,
      'fork result must include the promise of the task result'
    ),
    task._done.then(res => assert.equal(res, 1,
      'fork result must resolve with the return value of the forked task'
    ))

  }, DELAY)

});

test('processor join handling : generators', assert => {
  assert.plan(1);

  let actual = [];
  const defs = arrayOfDeffered(2)

  const input = cb => {
    Promise.resolve(1)
      .then(() => defs[0].resolve(true)) // make sure we don't run the input before the fork
      .then(() => cb({type: 'action-1'}))
      .then(() => defs[1].resolve(2))   // the result of the fork will be resolved the last
                                        // proc must not block and miss the 2 precedent effects

    return () => {}
  }

  function* subGen(arg) {
    yield defs[1].promise // will be resolved after the action-1
    return arg
  }

  function* genFn() {
    const task = yield io.fork(subGen, 1)
    actual.push( yield defs[0].promise )
    actual.push( yield io.take('action-1') )
    actual.push( yield io.join(task)  )
  }

  proc(genFn(), input).catch(err => assert.fail(err))
  const expected = [true, {type: 'action-1'}, 1]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must not block on forked tasks, but block on joined tasks'
    )
  }, DELAY)

});

test('processor fork/join handling : simple effects', assert => {
  assert.plan(1);

  let actual = [];
  const defs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => defs[0].resolve(true))
    .then(() => defs[1].resolve(2))

  function api() {
    return defs[1].promise
  }

  function* genFn() {
    const task = yield io.fork(api)

    actual.push( yield defs[0].promise )
    actual.push( yield io.join(task)  )
  }

  proc(genFn()).catch(err => assert.fail(err))
  const expected = [true, 2]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must not block on forked tasks, but block on joined tasks'
    )

  }, DELAY)

});
