import test from 'tape';
import proc from '../../src/proc'
import { is, arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/io'

const DELAY = 50
const delay = (ms) => () => new Promise(resolve => setTimeout(resolve, ms))

test('processor fork handling: generators', assert => {
  assert.plan(4);

  let task, task2;

  function* subGen(arg) {
    yield Promise.resolve(1)
    return arg
  }

  class C {
    constructor(val) {
      this.val = val
    }

    *gen() {
      return this.val
    }
  }

  const inst = new C(2)

  function* genFn() {
    task = yield io.fork(subGen, 1)
    task2 = yield io.fork([inst, inst.gen])
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  setTimeout(() => {

    assert.equal(task.name, 'subGen',
      'fork result must include the name of the forked generator function'
    ),
    assert.equal(is.promise(task.done), true,
      'fork result must include the promise of the task result'
    ),
    task.done.then(res => assert.equal(res, 1,
      'fork result must resolve with the return value of the forked task'
    ))

    task2.done.then(res => assert.equal(res, 2,
      'fork must also handle generators defined as instance methods'
    ))

  }, DELAY)

});

test('processor join handling : generators', assert => {
  assert.plan(1);

  let actual = [];
  const defs = arrayOfDeffered(2)

  const input = cb => {
    Promise.resolve(1)
      .then(() => defs[0].resolve(true))
      .then(delay(0))
      .then(() => cb({type: 'action-1'}))
      .then(delay(0))
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

  proc(genFn(), input).done.catch(err => assert.fail(err))
  const expected = [true, {type: 'action-1'}, 1]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must not block on forked tasks, but block on joined tasks'
    )
  }, DELAY)

});

test('processor fork/join handling : functions', assert => {
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

  proc(genFn()).done.catch(err => assert.fail(err))
  const expected = [true, 2]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'processor must not block on forked tasks, but block on joined tasks'
    )

  }, DELAY)

});
