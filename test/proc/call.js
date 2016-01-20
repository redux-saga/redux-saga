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
