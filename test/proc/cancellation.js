/* eslint-disable no-constant-condition */

import test from 'tape';
import proc, {
  CANCEL,
  MANUAL_CANCEL
} from '../../src/proc'
import SagaCancellationException from '../../src/SagaCancellationException'
import * as io from '../../src/io'
import { deferred, arrayOfDeffered } from '../../src/utils'

const DELAY = 50

const delay = (ms) => () => new Promise(resolve => setTimeout(resolve, ms))
const cancelPromise = p => p[CANCEL](new SagaCancellationException(MANUAL_CANCEL, 'test'))

test('processor effect cancellation handling: call effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDef = deferred()

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    //.then(delay(0))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDef.resolve('subroutine'))

  function* main() {
    actual.push(yield startDef.promise)
    try {
      actual.push(yield io.call(subroutine))
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine() {
    actual.push(yield 'subroutine start')
    try {
      actual.push(yield subroutineDef.promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine cancelled')
    }
  }

  const endP = proc(main()).done
  cancelDef.promise.then(v => {
    actual.push(v)
    cancelPromise(endP)
  })
  endP.catch(err => assert.fail(err))

  const expected = ['start', 'subroutine start',
    'cancel', 'subroutine cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled call effect must throw exception inside called subroutine"
    )
    assert.end()
  }, DELAY)
})

test('processor effect cancellation handling: take effect', assert => {
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
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'cancelled')
    }
  }

  const endP = proc(main(), input).done
  cancelDef.promise.then(v => {
    actual.push(v)
    cancelPromise(endP)
  })
  endP.catch(err => assert.fail(err))

  const expected = ['start', 'cancel', 'cancelled'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled take effect must stop waiting for action"
    );
    assert.end();
  }, DELAY)
})

test('processor effect cancellation handling: join effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDef = deferred()

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    //.then(delay(0))
    .then(() => cancelDef.resolve('cancel'))
    .then(() => subroutineDef.resolve('subroutine'))

  function* main() {
    actual.push(yield startDef.promise)
    let task = yield io.fork(subroutine)
    try {
      actual.push(yield io.join(task))
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine() {
    actual.push(yield 'subroutine start')
    try {
      actual.push(yield subroutineDef.promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine cancelled')
    }
  }

  const endP = proc(main()).done
  cancelDef.promise.then(v => {
    actual.push(v)
    cancelPromise(endP)
  })
  endP.catch(err => assert.fail(err))

  const expected = ['start', 'subroutine start',
    'cancel', 'subroutine cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled join effect must cancel joined subroutine"
    )
    assert.end()
  }, DELAY)
})

test('processor effect cancellation handling: parallel effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    //.then(delay(0))
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
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine1() {
    actual.push(yield 'subroutine 1 start')
    try {
      actual.push(yield subroutineDefs[0].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine 1 cancelled')
    }
  }

  function* subroutine2() {
    actual.push(yield 'subroutine 2 start')
    try {
      actual.push(yield subroutineDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine 2 cancelled')
    }
  }

  const endP = proc(main()).done
  cancelDef.promise.then(v => {
    actual.push(v)
    cancelPromise(endP)
  })
  endP.catch(err => assert.fail(err))

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
  }, DELAY)
})

test('processor effect cancellation handling: race effect', assert => {
  assert.plan(1)

  let actual = []
  let startDef = deferred()
  let cancelDef = deferred()
  let subroutineDefs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => startDef.resolve('start'))
    //.then(delay(0))
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
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'cancelled')
    }
  }

  function* subroutine1() {
    actual.push(yield 'subroutine 1 start')
    try {
      actual.push(yield subroutineDefs[0].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine cancelled')
    }
  }

  function* subroutine2() {
    actual.push(yield 'subroutine 2 start')
    try {
      actual.push(yield subroutineDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'subroutine cancelled')
    }
  }

  const endP = proc(main()).done
  cancelDef.promise.then(v => {
    actual.push(v)
    cancelPromise(endP)
  })
  endP.catch(err => assert.fail(err))

  const expected = ['start',
    'subroutine 1 start', 'subroutine 2 start',
    'cancel',
    'subroutine cancelled', 'subroutine cancelled', 'cancelled']

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "cancelled race effect must cancel all sub-effects"
    )
    assert.end()
  }, DELAY)
})

test('processor automatic parallel effect cancellation handling', assert => {
  assert.plan(1);

  let actual = []
  let subtask1Defs = arrayOfDeffered(2),
      subtask2Defs = arrayOfDeffered(2)

  Promise.resolve(1)
    .then(() => subtask1Defs[0].resolve('subtask_1'))
    .then(() => subtask2Defs[0].resolve('subtask_2'))
    .then(() => subtask1Defs[1].reject('subtask_1 rejection'))
    //.then(delay(0))
    .then(() => subtask2Defs[1].resolve('subtask_2_2'))

  function* subtask1() {
    actual.push(yield subtask1Defs[0].promise)
    actual.push(yield subtask1Defs[1].promise)
  }

  function* subtask2() {
    try {
      actual.push(yield subtask2Defs[0].promise)
      actual.push(yield subtask2Defs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
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
    //.then(delay(0))
    .then(() => loserSubtaskDefs[1].resolve('loser_2'))
    .then(() => parallelSubtaskDefs[1].resolve('parallel_2'))

  function* winnerSubtask() {
    try {
      actual.push(yield winnerSubtaskDefs[0].promise)
      actual.push(yield winnerSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'winner subtask cancelled')
    }
  }

  function* loserSubtask() {
    try {
      actual.push(yield loserSubtaskDefs[0].promise)
      actual.push(yield loserSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
        actual.push(yield 'loser subtask cancelled')
    }
  }

  function* parallelSubtask() {
    try {
      actual.push(yield parallelSubtaskDefs[0].promise)
      actual.push(yield parallelSubtaskDefs[1].promise)
    } catch (e) {
      if (e instanceof SagaCancellationException)
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

  }, DELAY)
})

test('processor manual task cancellation handling', assert => {
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

  proc(genFn()).done.catch(err => assert.fail(err))
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

  proc(genFn()).done.catch(err => assert.fail(err))
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
    //.then(delay(0))
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

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = ['start', 'subtask_1', 'nested_task_1', 'stop',
    'subtask cancelled', 'nested_task_2']

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must cancel forked task but not its forked nested subtask'
    )

  }, DELAY)
})
