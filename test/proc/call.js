import test from 'tape';
import proc from '../../src/internal/proc'
import * as io from '../../src/effects'

const DELAY = 50

test('processor declarative call handling', assert => {
  assert.plan(1);

  let actual = [];

  class C {
    constructor(val) {
      this.val = val
    }

    method() {
      return Promise.resolve(this.val)
    }
  }

  const inst1 = new C(1)
  const inst2 = new C(2)
  const inst3 = new C(3)

  function* subGen(io, arg) {
    yield Promise.resolve(null)
    return arg
  }

  function* genFn() {
    actual.push( yield io.call([inst1, inst1.method])  )
    actual.push( yield io.call({context: inst2, fn: inst2.method})  )
    actual.push( yield io.apply(inst3, inst3.method)  )
    actual.push( yield io.call(subGen, io, 4)  )
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = [1, 2, 3, 4];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill declarative call effects"
    );
    assert.end();
  }, DELAY)

});

test('processor synchronous call failures handling', assert => {
  assert.plan(1);

  let actual = []
  const dispatch = v => actual.push(v)


  function* genFnChild() {
    try {
      yield io.put("startChild")
      yield io.call(() => {
        throw new Error("child error")
      });
      yield io.put("success child")
    }
    catch (e) {
      yield io.put("failure child")
    }
  }

  function* genFnParent() {
    try {
      yield io.put("start parent")
      yield io.call(genFnChild);
      yield io.put("success parent")
    }
    catch (e) {
      yield io.put("failure parent")
    }
  }

  proc(genFnParent(),undefined,dispatch).done.catch(err => assert.fail(err))


  const expected = ['start parent','startChild','failure child','success parent'];
  setTimeout(() => {
    assert.deepEqual(actual, expected,"processor should inject call error into generator")
    assert.end()
  }, DELAY)

});
