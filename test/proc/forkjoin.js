import test from 'tape';
import proc from '../../src/internal/proc'
import { is, deferred, arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/effects'


test('proc fork handling: generators', assert => {
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

  }, 0)

});

test('proc detects fork\'s synchronous failures and fails the forked task', assert => {
  assert.plan(1);

  let actual = []
  const dispatch = v => (actual.push(v), v)


  function* genFnChild() {
    throw "child error"
  }

  function* genFnParent() {
    try {
      yield io.put("start parent")
      const task = yield io.fork(genFnChild);
      const taskError = task.error()
      if(taskError)
        actual.push(taskError)

      yield io.put("success parent")
    }
    catch (e) {
      yield io.put("failure parent")
    }
  }

  proc(genFnParent(),undefined,dispatch).done.catch(err => assert.fail(err))


  const expected = ['start parent','child error','success parent'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"proc should inject fork errors into forked tasks")
    assert.end()
  }, 0)

});

test('proc join handling : generators', assert => {
  assert.plan(1);

  let actual = [];
  const defs = arrayOfDeffered(2)

  const input = cb => {
    Promise.resolve(1)
      .then(() => defs[0].resolve(true))
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

  proc(genFn(), input).done.catch(err => assert.fail(err))
  const expected = [true, {type: 'action-1'}, 1]

  setTimeout(() => {

    assert.deepEqual(actual, expected,
      'proc must not block on forked tasks, but block on joined tasks'
    )
  }, 0)

});

test('proc fork/join handling : functions', assert => {
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
      'proc must not block on forked tasks, but block on joined tasks'
    )

  }, 0)

});

test('proc fork wait for children', assert => {
  assert.plan(1)

  const actual = []
  const rootDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeffered(4)

  Promise.resolve()
    .then(childAdef.resolve)
    .then(rootDef.resolve)
    .then(defs[0].resolve)
    .then(childBdef.resolve)
    .then(defs[2].resolve)
    .then(defs[3].resolve)
    .then(defs[1].resolve)


  function* root() {
    yield io.fork(childA)
    yield rootDef.promise
    yield io.fork(childB)
  }

  function* childA() {
    yield io.fork(leaf, 0)
    yield childAdef.promise
    yield io.fork(leaf, 1)
  }

  function* childB() {
    yield io.fork(leaf, 2)
    yield childBdef.promise
    yield io.fork(leaf, 3)
    throw 'error childB'
  }

  function* leaf(idx) {
    yield defs[idx].promise
    actual.push(idx)
  }

  proc(root()).done.then(() => {
    assert.deepEqual(actual, [0,2,3,1], 'parent task must for all forked tasks before terminating')
  }).catch(err => assert.fail(err))

})
