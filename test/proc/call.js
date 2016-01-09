import test from 'tape';
import proc from '../../src/proc'
import * as io from '../../src/io'

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

  const inst = new C(1)

  function* subGen(io, arg) {
    yield Promise.resolve(null)
    return arg
  }

  function* genFn() {
    actual.push( yield io.apply(inst, inst.method)  )
    actual.push( yield io.call(subGen, io, 2)  )
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = [1, 2];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill declarative call effects"
    );
    assert.end();
  }, DELAY)

});
