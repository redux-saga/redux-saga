/* eslint-disable no-constant-condition */

import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'
import { deferred, arrayOfDeffered } from '../../src/utils'


test('proc cancellation: call effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDef = deferred()

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDef.resolve('subroutine'))

  function* main() {
    actual.push(yield startDef.promise)
    try {
      actual.push(yield io.call(subroutine))
    } finally {
      if(yield io.cancelled())
        actual.push('cancelled')
    }
  }

  function* subroutine() {
    actual.push(yield 'subroutine start')
    try {
      actual.push(yield subroutineDef.promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine cancelled')
    }
  }

  const task = proc(main())
  cancelDef.promise.then(v => {
    actual.push(v)
    task.cancel()
  })
  task.done.catch(err => assert.fail(err))

  const expected = ['start', 'subroutine start',
    'cancel', 'subroutine cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled call effect must throw exception inside called subroutine"
    )
    assert.end()
  })
})

test('proc cancellation: forked children', assert => {
  assert.plan(1)

  const actual = []
  let cancelDef = deferred()
  const rootDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const neverDef = deferred()
  const defs = arrayOfDeffered(4)

  Promise.resolve()
    .then(() => childAdef.resolve('childA resolve'))
    .then(() => rootDef.resolve('root resolve'))
    .then(() => defs[0].resolve('leaf 0 resolve'))
    .then(() => childBdef.resolve('childB resolve'))
    //
    .then(() => cancelDef.resolve('cancel'))
    .then(() => defs[3].resolve('leaf 3 resolve'))
    .then(() => defs[2].resolve('leaf 2 resolve'))
    .then(() => defs[1].resolve('leaf 1 resolve'))


  function* main() {
    try {
      yield io.fork(childA)
      actual.push( yield rootDef.promise )
      yield io.fork(childB)
      yield neverDef.promise
    } finally {
      if(yield io.cancelled())
        actual.push('main cancelled')
    }

  }

  function* childA() {
    try {
      yield io.fork(leaf, 0)
      actual.push( yield childAdef.promise )
      yield io.fork(leaf, 1)
      yield neverDef.promise
    } finally {
      if(yield io.cancelled())
        actual.push('childA cancelled')
    }
  }

  function* childB() {
    try {
      yield io.fork(leaf, 2)
      actual.push( yield childBdef.promise )
      yield io.fork(leaf, 3)
      yield neverDef.promise
    } finally {
      if(yield io.cancelled())
        actual.push('childB cancelled')
    }
  }

  function* leaf(idx) {
    try {
      actual.push( yield defs[idx].promise )
    } finally {
      if(yield io.cancelled())
        actual.push(`leaf ${idx} cancelled`)
    }
  }


  const task = proc(main())
  cancelDef.promise.then(() => task.cancel())
  task.done.catch(err => assert.fail(err))

  const expected = [
    'childA resolve', 'root resolve', 'leaf 0 resolve', 'childB resolve',
    /* cancel */
    'main cancelled',
      'childA cancelled',
          'leaf 1 cancelled',
      'childB cancelled',
          'leaf 2 cancelled', 'leaf 3 cancelled'
  ]

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled main task must cancel all forked substasks"
    )
    assert.end()
  })
})

test('proc cancellation: take effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()

  const input = cb => {
    Promise.resolve(1)
      .then(() => startDef.resolve('start'))
      .then(() => cancelDef.resolve('cancel'))
      .then(() => cb({type: 'action'}))
    return () => {}
  }

  function* main() {
    actual.push(yield startDef.promise)
    try {
      actual.push(yield io.take('action'))
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'cancelled')
    }
  }

  const task = proc(main(), input)
  cancelDef.promise.then(v => {
    actual.push(v)
    task.cancel()
  })
  task.done.catch(err => assert.fail(err))

  const expected = ['start', 'cancel', 'cancelled'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled take effect must stop waiting for action"
    );
    assert.end();
  })
})

test('proc cancellation: join effect (joining from a different task)', assert => {
  assert.plan(1)

  let actual = []
  let cancelDef = deferred()
  let subroutineDef = deferred()

  Promise.resolve(1)
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDef.resolve('subroutine'))

  function* main() {
    actual.push('start')
    let task = yield io.fork(subroutine)
    yield io.fork(callerOfJoiner1, task)
    yield io.fork(joiner2, task)

    actual.push(yield cancelDef.promise)
    yield io.cancel(task)
  }

  function* subroutine() {
    actual.push('subroutine start')
    try {
      actual.push(yield subroutineDef.promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine cancelled')
    }
  }

  function* callerOfJoiner1(task) {
    try {
      actual.push( yield [io.call(joiner1, task), new Promise(() => {})] )
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'caller of joiner1 cancelled')
    }
  }

  function* joiner1(task) {
    actual.push('joiner1 start')
    try {
      actual.push(yield io.join(task))
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'joiner1 cancelled')
    }
  }

  function* joiner2(task) {
    actual.push('joiner2 start')
    try {
      actual.push(yield io.join(task))
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'joiner2 cancelled')
    }
  }

  const task = proc(main())
  task.done.catch(err => assert.fail(err))

  /**
    Breaking change in 10.0:
  **/
  const expected = ['start', 'subroutine start', 'joiner1 start', 'joiner2 start',
    'cancel', 'subroutine cancelled', 'joiner1 cancelled', 'caller of joiner1 cancelled', 'joiner2 cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled task must cancel foreing joiners"
    )
    assert.end()
  })
})

test('proc cancellation: join effect (join from the same task\'s parent)', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDef = deferred()

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDef.resolve('subroutine'))

  function* main() {
    actual.push(yield startDef.promise)
    let task = yield io.fork(subroutine)
    try {
      actual.push(yield io.join(task))
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine() {
    actual.push(yield 'subroutine start')
    try {
      actual.push(yield subroutineDef.promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine cancelled')
    }
  }

  const task = proc(main())
  cancelDef.promise.then(v => {
    actual.push(v)
    task.cancel()
  })
  task.done.catch(err => assert.fail(err))

  /**
    Breaking change in 10.0: Since now attached forks are cancelled when their parent is cancelled
    cancellation of main will trigger in order: 1. cancel parent (main) 2. then cancel children (subroutine)

    Join cancellation has the following semantics: cancellation of a task triggers cancellation of all its
    joiners (similar to promise1.then(promise2): promise2 depends on promise1, if promise1 os cancelled,
    then so promise2 must be cancelled).

    In the present test, main is joining on of its proper children, so this would cause an endless loop, but
    since cancellation is noop on an already terminated task the deadlock wont happen
  **/
  const expected = ['start', 'subroutine start', 'cancel', 'cancelled', 'subroutine cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled routine must cancel proper joiners"
    )
    assert.end()
  })
})

test('proc cancellation: parallel effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    .then(() => subroutineDefs[0].resolve('subroutine 1'))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDefs[1].resolve('subroutine 2'))

  function* main() {
    actual.push(yield startDef.promise)
    try {
      actual.push(yield [
        io.call(subroutine1),
        io.call(subroutine2)
      ])
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine1() {
    actual.push(yield 'subroutine 1 start')
    try {
      actual.push(yield subroutineDefs[0].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine 1 cancelled')
    }
  }

  function* subroutine2() {
    actual.push(yield 'subroutine 2 start')
    try {
      actual.push(yield subroutineDefs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine 2 cancelled')
    }
  }

  const task = proc(main())
  cancelDef.promise.then(v => {
    actual.push(v)
    task.cancel()
  })
  task.done.catch(err => assert.fail(err))

  const expected = ['start',
    'subroutine 1 start', 'subroutine 2 start',
    'subroutine 1',
    'cancel',
    'subroutine 2 cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled parallel effect must cancel all sub-effects"
    )
    assert.end()
  })
})

test('proc cancellation: race effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDefs[0].resolve('subroutine 1'))
    .then(() => subroutineDefs[1].resolve('subroutine 2'))

  function* main() {
    actual.push(yield startDef.promise)
    try {
      actual.push(yield io.race({
        subroutine1: io.call(subroutine1),
        subroutine2: io.call(subroutine2)
      }))
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine1() {
    actual.push(yield 'subroutine 1 start')
    try {
      actual.push(yield subroutineDefs[0].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine cancelled')
    }
  }

  function* subroutine2() {
    actual.push(yield 'subroutine 2 start')
    try {
      actual.push(yield subroutineDefs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subroutine cancelled')
    }
  }

  const task = proc(main())
  cancelDef.promise.then(v => {
    actual.push(v)
    task.cancel()
  })
  task.done.catch(err => assert.fail(err))

  const expected = ['start',
    'subroutine 1 start', 'subroutine 2 start',
    'cancel',
    'subroutine cancelled', 'subroutine cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled race effect must cancel all sub-effects"
    )
    assert.end()
  })
})

test('proc cancellation: automatic parallel effect cancellation', assert => {
  assert.plan(1);

  let actual = []
  let subtask1Defs = arrayOfDeffered(2),
      subtask2Defs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => subtask1Defs[0].resolve('subtask_1'))
    .then(() => subtask2Defs[0].resolve('subtask_2'))
    .then(() => subtask1Defs[1].reject('subtask_1 rejection'))
    .then(() => subtask2Defs[1].resolve('subtask_2_2'))

  function* subtask1() {
    actual.push(yield subtask1Defs[0].promise)
    actual.push(yield subtask1Defs[1].promise)
  }

  function* subtask2() {
    try {
      actual.push(yield subtask2Defs[0].promise)
      actual.push(yield subtask2Defs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subtask 2 cancelled')
    }
  }

  function* genFn() {
    try {
      yield [
        io.call(subtask1),
        io.call(subtask2)
      ]
    } catch (e) {
      actual.push(yield `caught ${e}`)
    }
  }

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = ['subtask_1', 'subtask_2',
    'subtask 2 cancelled', 'caught subtask_1 rejection']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel parallel sub-effects on rejection'
    )

  })

})

test('proc cancellation: automatic race competitor cancellation', assert => {
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
    .then(() => loserSubtaskDefs[1].resolve('loser_2'))
    .then(() => parallelSubtaskDefs[1].resolve('parallel_2'))

  function* winnerSubtask() {
    try {
      actual.push(yield winnerSubtaskDefs[0].promise)
      actual.push(yield winnerSubtaskDefs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'winner subtask cancelled')
    }
  }

  function* loserSubtask() {
    try {
      actual.push(yield loserSubtaskDefs[0].promise)
      actual.push(yield loserSubtaskDefs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'loser subtask cancelled')
    }
  }

  function* parallelSubtask() {
    try {
      actual.push(yield parallelSubtaskDefs[0].promise)
      actual.push(yield parallelSubtaskDefs[1].promise)
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'parallel subtask cancelled')
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

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = ['winner_1', 'loser_1', 'parallel_1', 'winner_2',
    'loser subtask cancelled', 'parallel_2']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel race competitors except for the winner'
    )

  })
})

test('proc cancellation:  manual task cancellation', assert => {
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
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'task cancelled')
    }
  }

  function* genFn() {
    actual.push( yield signIn.promise )
    const task = yield io.fork(subtask)
    actual.push( yield signOut.promise )
    yield io.cancel(task)
  }

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = ['signIn', 'expire_1', 'expire_2', 'signOut', 'task cancelled']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'proc must cancel forked tasks'
    )

  })

});

test('proc cancellation: nested task cancellation', assert => {
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
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'nested task 1 cancelled')
    }
  }

  function* nestedTask2() {
    try {
      actual.push( yield nestedTask2Defs[0].promise )
      actual.push( yield nestedTask2Defs[1].promise )
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'nested task 2 cancelled')
    }
  }


  function* subtask() {
    try {
      actual.push( yield subtaskDefs[0].promise )
      yield [io.call(nestedTask1), io.call(nestedTask2)]
      actual.push( yield subtaskDefs[1].promise )
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subtask cancelled')
    }
  }

  function* genFn() {
    actual.push( yield start.promise )
    const task = yield io.fork(subtask)
    actual.push( yield stop.promise )
    yield io.cancel(task)
  }

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = ['start', 'subtask_1',
    'nested_task_1_1', 'nested_task_2_1', 'stop',
    'nested task 1 cancelled', 'nested task 2 cancelled',
    'subtask cancelled']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel forked task and its nested subtask'
    )

  })
})

test('proc cancellation: nested forked task cancellation', assert => {
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
    //
    .then(() => nestedTaskDefs[1].resolve('nested_task_2'))
    .then(() => subtaskDefs[1].resolve('subtask_2'))

  function* nestedTask() {
    try {
      actual.push( yield nestedTaskDefs[0].promise )
      actual.push( yield nestedTaskDefs[1].promise )
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'nested task cancelled')
    }
  }

  function* subtask() {
    try {
      actual.push( yield subtaskDefs[0].promise )
      yield io.fork(nestedTask)
      actual.push( yield subtaskDefs[1].promise )
    } finally {
      if(yield io.cancelled())
        actual.push(yield 'subtask cancelled')
    }
  }

  function* genFn() {
    actual.push( yield start.promise )
    const task = yield io.fork(subtask)
    actual.push( yield stop.promise )
    yield io.cancel(task)
  }

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = [
    'start', 'subtask_1', 'nested_task_1',
    'stop',
    'subtask cancelled', 'nested task cancelled'
  ]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'proc must cancel forked task and its forked nested subtask'
    )

  })
})

test('cancel should be able to cancel multiple tasks', assert => {
  assert.plan(1)

  const defs = arrayOfDeffered(3)
  let actual = []

  function* worker(i) {
    try {
      yield defs[i].promise
    } finally {
      if(yield io.cancelled()) {
        actual.push(i)
      }
    }
  }

  function* genFn() {
    const t1 = yield io.fork(worker, 0)
    const t2 = yield io.fork(worker, 1)
    const t3 = yield io.fork(worker, 2)
    yield io.cancel(t1, t2, t3)
  }

  const expected = [0, 1, 2]

  proc(genFn()).done
    .then(() => {
      assert.deepEqual(actual, expected,
        'it must be possible to cancel multiple tasks at once'
      )
    })
    .catch(err => assert.fail(err))
})

test('cancel should support for self cancellation', assert => {
  assert.plan(1)

  let actual = []

  function* worker() {
    try {
      yield io.cancel()
    } finally {
      if (yield io.cancelled()) {
        actual.push('self cancellation')
      }
    }
  }

  function* genFn() {
    yield io.fork(worker)
  }

  const expected = ['self cancellation']

  proc(genFn()).done
    .then(() => {
      assert.deepEqual(actual, expected,
        'it must be possible to trigger self cancellation'
      )
    })
    .catch(err => assert.fail(err))
})
