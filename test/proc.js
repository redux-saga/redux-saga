/* eslint-disable no-constant-condition */

import test from 'tape';
import proc, { NOT_ITERATOR_ERROR, SagaCancellationException } from '../src/proc'
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
      .then(() => defs[0].resolve(true)) // make sure we don't run the input
                                         // before the fork
      .then(() => cb({type: 'action-1'}))
      .then(() => defs[1].resolve(2))   // the result of the fork will be
                                        // resolved the last proc must not
                                        // block and miss the 2 precedent
                                        // effects

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

test('processor task cancellation handling', assert => {
  assert.plan(1);

  let actual = [];
  let signIn = deferred(),
      signOut = deferred(),
      expires = arrayOfDeffered(3)


  Promise.resolve(1)
    .then(() => signIn.resolve('signIn'))
    .then(() => expires[0].resolve('expire_1'))
    .then(() => expires[1].resolve('expire_2'))
    .then(() => signOut.resolve('signOut'))
    .then(() => expires[2].resolve('expire_3'))

  function* subtask() {
    try {
      for (var i = 0; i < expires.length; i++) {
        actual.push( yield expires[i].promise )
      }
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'task cancelled')
    }
  }

  function* genFn() {
    actual.push( yield signIn.promise )
    const task = yield io.fork(subtask)
    actual.push( yield signOut.promise )
    yield io.cancel(task)
  }

  proc(genFn()).catch(err => assert.fail(err))
  const expected = ['signIn', 'expire_1', 'expire_2', 'signOut', 'task cancelled']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel forked tasks'
    )

  }, DELAY)

});

test('processor nested task cancellation handling', assert => {
  assert.plan(1)

  let actual = []
  let start = deferred(),
    stop = deferred(),
    subtaskDefs = arrayOfDeffered(2),
    nestedTask1Defs = arrayOfDeffered(2),
    nestedTask2Defs = arrayOfDeffered(2)


  Promise.resolve(1)
    .then(() => start.resolve('start'))
    .then(() => subtaskDefs[0].resolve('subtask_1'))
    .then(() => nestedTask1Defs[0].resolve('nested_task_1_1'))
    .then(() => nestedTask2Defs[0].resolve('nested_task_2_1'))
    .then(() => stop.resolve('stop'))
    .then(() => nestedTask1Defs[1].resolve('nested_task_1_2'))
    .then(() => nestedTask2Defs[1].resolve('nested_task_2_2'))
    .then(() => subtaskDefs[1].resolve('subtask_2'))

  function* nestedTask1() {
    try {
      actual.push( yield nestedTask1Defs[0].promise )
      actual.push( yield nestedTask1Defs[1].promise )
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'nested task 1 cancelled')
    }
  }

  function* nestedTask2() {
    try {
      actual.push( yield nestedTask2Defs[0].promise )
      actual.push( yield nestedTask2Defs[1].promise )
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'nested task 2 cancelled')
    }
  }


  function* subtask() {
    try {
      actual.push( yield subtaskDefs[0].promise )
      yield [io.call(nestedTask1), io.call(nestedTask2)]
      actual.push( yield subtaskDefs[1].promise )
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subtask cancelled')
    }
  }

  function* genFn() {
    actual.push( yield start.promise )
    const task = yield io.fork(subtask)
    actual.push( yield stop.promise )
    yield io.cancel(task)
  }

  proc(genFn()).catch(err => assert.fail(err))
  const expected = ['start', 'subtask_1',
    'nested_task_1_1', 'nested_task_2_1', 'stop',
    'nested task 1 cancelled', 'nested task 2 cancelled',
    'subtask cancelled']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel forked task and its nested subtask'
    )

  }, DELAY)
})

test('processor nested forked task cancellation handling', assert => {
  assert.plan(1)

  let actual = []
  let start = deferred(),
    stop = deferred(),
    subtaskDefs = arrayOfDeffered(2),
    nestedTaskDefs = arrayOfDeffered(2)


  Promise.resolve(1)
    .then(() => start.resolve('start'))
    .then(() => subtaskDefs[0].resolve('subtask_1'))
    .then(() => nestedTaskDefs[0].resolve('nested_task_1'))
    .then(() => stop.resolve('stop'))
    .then(() => nestedTaskDefs[1].resolve('nested_task_2'))
    .then(() => subtaskDefs[1].resolve('subtask_2'))

  function* nestedTask() {
    try {
      actual.push( yield nestedTaskDefs[0].promise )
      actual.push( yield nestedTaskDefs[1].promise )
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'nested task cancelled')
    }
  }

  function* subtask() {
    try {
      actual.push( yield subtaskDefs[0].promise )
      yield io.fork(nestedTask)
      actual.push( yield subtaskDefs[1].promise )
    } catch (e) {
      actual.push(yield 'subtask cancelled')
    }
  }

  function* genFn() {
    actual.push( yield start.promise )
    const task = yield io.fork(subtask)
    actual.push( yield stop.promise )
    yield io.cancel(task)
  }

  proc(genFn()).catch(err => assert.fail(err))
  const expected = ['start', 'subtask_1', 'nested_task_1', 'stop',
    'subtask cancelled', 'nested_task_2']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel forked task and its nested subtask'
    )

  }, DELAY)
})


test('processor automatic race competitor cancellation handling', assert => {
  assert.plan(1);

  let actual = []
  let winnerSubtaskDefs = arrayOfDeffered(2),
    loserSubtaskDefs = arrayOfDeffered(2),
    parallelSubtaskDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => winnerSubtaskDefs[0].resolve('winner_1'))
    .then(() => loserSubtaskDefs[0].resolve('loser_1'))
    .then(() => parallelSubtaskDefs[0].resolve('parallel_1'))
    .then(() => winnerSubtaskDefs[1].resolve('winner_2'))
    .then(() => new Promise(resolve => setTimeout(resolve, 10)))
    .then(() => loserSubtaskDefs[1].resolve('loser_2'))
    .then(() => parallelSubtaskDefs[1].resolve('parallel_2'))

  function* winnerSubtask() {
    try {
      actual.push(yield winnerSubtaskDefs[0].promise)
      actual.push(yield winnerSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException) {
        actual.push(yield 'winner subtask cancelled')
      }
    }
  }

  function* loserSubtask() {
    try {
      actual.push(yield loserSubtaskDefs[0].promise)
      actual.push(yield loserSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException) {
        actual.push(yield 'loser subtask cancelled')
      }
    }
  }

  function* parallelSubtask() {
    try {
      actual.push(yield parallelSubtaskDefs[0].promise)
      actual.push(yield parallelSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException) {
        actual.push(yield 'parallel subtask cancelled')
      }
    }
  }


  function* genFn() {
    yield [
      io.race({
        winner: io.call(winnerSubtask),
        loser: io.call(loserSubtask)
      }),
      io.call(parallelSubtask)
    ]
  }

  proc(genFn()).catch(err => assert.fail(err))
  const expected = ['winner_1', 'loser_1', 'parallel_1', 'winner_2',
    'loser subtask cancelled', 'parallel_2']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel race competitors'
    )

  }, DELAY)

})
