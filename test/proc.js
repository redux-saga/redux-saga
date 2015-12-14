import test from 'tape';
import proc, { NOT_ITERATOR_ERROR } from '../src/proc'
import io from '../src/io'

const DELAY = 50
const later = (val, ms) => new Promise(resolve => {
  setTimeout(() => resolve(val), ms)
})


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

  proc(genFn('arg'), undefined, dispatch)

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

  function* genFn() {
    actual.push(yield later(1, 4))
    actual.push(yield later(2, 8))
  }

  proc(genFn())

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

  function* genFn() {
    actual.push( yield io.call(later, 1, 4)  )
  }

  proc(genFn())

  const expected = [1];

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

  proc(genFn(), input)


  const expected = [{type: 'action-*'}, {type: 'action-1'}, {type: 'action-2'}, {isAction: true}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill input queries from the generator"
    );
    assert.end();
  }, DELAY)

});

test('processor thunk handling', assert => {
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

  proc(genFn())

  const expected = ['call 1', 'call err'];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill thunk effects"
    );
    assert.end();
  }, DELAY)

});

test('processor array of effects handling', assert => {
  assert.plan(1);

  let actual;
  const input = cb => {
    setTimeout(() => cb({type: 'action'}), 20)
    return () => {}
  }

  function* genFn() {
    actual = yield [
      later(1, 4),
      io.call(later, 2, 8),
      io.cps( cb => setTimeout(() => cb(null, 3), 12) ),
      io.take('action')
    ]
  }

  proc(genFn(), input)


  const expected = [1,2,3, {type: 'action'}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill parallel effects"
    );
    assert.end();
  }, DELAY)

});

/* TODO test that a failed promise inside the array throws an exception inside the Generator */

test('processor race between effects handling', assert => {
  assert.plan(1);

  let actual = [];
  const input = cb => {
    setTimeout(() => cb({type: 'action'}), 16)
    return () => {}
  }

  function* genFn() {
    actual.push( yield io.race({
      event: io.take('action'),
      timeout: later(1, 4)
    }) )
  }

  proc(genFn(), input)

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
  const input = cb => {
    setTimeout(() => cb({type: 'action-1'}), 16)
    setTimeout(() => cb({type: 'action-2'}), 32)
    setTimeout(() => cb({type: 'action-3'}), 64)
    return () => {}
  }

  function* child() {

  }

  function* main() {
    actual.push( yield later(1, 4) )        // 4ms (0+4)
    actual.push(yield io.take('action-1'))  // 20ms (fixed)

    actual.push( yield later(2, 4) )        // 24ms (20+4)
    actual.push(yield io.take('action-2'))  // 32ms  (fixed)

    actual.push( yield later(3, 4) )        // 36ms (32+4)
    actual.push(yield io.take('action-3'))  // 64ms (fixed)
  }

  proc(main(), input)

  const expected = [1, {type: 'action-1'}, 2, {type: 'action-2'}, 3, {type: 'action-3'}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill nested iterator effects"
    );
    assert.end();
  }, DELAY*2)

});
