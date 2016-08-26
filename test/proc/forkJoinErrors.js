import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'

test('proc sync fork failures: functions', assert => {
  assert.plan(1);

  let actual = []

  // NOTE: we'll be forking a function not a Generator
  function immediatelyFailingFork() {
    throw 'immediatelyFailingFork'
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(immediatelyFailingFork)
      actual.push('success parent')
    }
    catch (e) {
      actual.push('parent caught ' + e)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.call(genParent)
      actual.push('success main')
    } catch(e) {
      actual.push('main caught ' + e)
    }
  }

  proc(main()).done.catch(err => assert.fail(err))


  const expected = ['start main', 'start parent', 'main caught immediatelyFailingFork'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"proc should fails the parent if a forked function fails synchronously")
    assert.end()
  }, 0)

});

test('proc sync fork failures: functions/error bubbling', assert => {
  assert.plan(1);

  let actual = []

  // NOTE: we'll be forking a function not a Generator
  function immediatelyFailingFork() {
    throw 'immediatelyFailingFork'
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(immediatelyFailingFork)
      actual.push('success parent')
    }
    catch (e) {
      actual.push('parent caught ' + e)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.fork(genParent)
      actual.push('success main')
    } catch(e) {
      actual.push('main caught ' + e)
    }
  }

  proc(main()).done.catch(err => {
    actual.push('uncaught ' + err)
  })


  const expected = ['start main', 'start parent', 'uncaught immediatelyFailingFork'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"proc should propagates errors up to the root of fork tree")
    assert.end()
  }, 0)

});

test('proc fork\'s failures: generators', assert => {
  assert.plan(1);

  let actual = []

  function* genChild() {
    throw 'gen error'
  }

  function* genParent() {
    try {
      actual.push('start parent')
      yield io.fork(genChild)
      actual.push('success parent')
    }
    catch (e) {
      actual.push('parent caught ' + e)
    }
  }

  function* main() {
    try {
      actual.push('start main')
      yield io.call(genParent)
      actual.push('success main')
    } catch(e) {
      actual.push('main caught ' + e)
    }
  }

  proc(main()).done.catch(err => assert.fail(err))


  const expected = ['start main', 'start parent', 'main caught gen error'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"proc should fails the parent if a forked generator fails synchronously")
    assert.end()
  }, 0)

});

test('proc sync fork failures: spawns (detached forks)', assert => {
  assert.plan(1);

  let actual = []

  function* genChild() {
    throw 'gen error'
  }

  function* main() {
    try {
      actual.push('start main')
      const task = yield io.spawn(genChild)
      actual.push('spawn ' + task.name)
      actual.push('success parent')
    }
    catch (e) {
      actual.push('main caught ' + e)
    }
  }

  proc(main()).done.catch(err => assert.fail(err))


  const expected = ['start main', 'spawn genChild', 'success parent'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"proc should not fail a parent with errors from detached forks (spawn)")
    assert.end()
  }, 0)


});
