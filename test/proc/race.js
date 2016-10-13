import test from 'tape';
import { END } from '../../src'
import proc from '../../src/internal/proc'
import { deferred } from '../../src/utils'
import * as io from '../../src/effects'


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

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [{timeout: 1}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must fullfill race between effects"
    );
    assert.end();
  })
});

test('processor race between effects: handle END', assert => {
  assert.plan(1);

  let actual = [];
  const timeout = deferred()
  const input = cb => {
    Promise.resolve(1)
      .then(() => cb(END))
      .then(() => timeout.resolve(1) )

    return () => {}
  }

  function* genFn() {
    actual.push( yield io.race({
      event: io.take('action'),
      timeout: timeout.promise
    }) )
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [{timeout: 1}];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must not resolve race effects with END"
    );
    assert.end();
  })
});

test('processor race between sync effects', assert => {
  assert.plan(1);

  let actual = [];
  const input = cb => {
    Promise.resolve(1)
      .then(() => cb({type: 'x'}))
      .then(() => cb({type: 'y'}))
      .then(() => cb({type: 'start'}))
    return () => {}
  }

  function* genFn() {
    const xChan = yield io.actionChannel('x')
    const yChan = yield io.actionChannel('y')

    yield io.take('start')

    yield io.race({
      x: io.take(xChan),
      y: io.take(yChan)
    })

    yield Promise.resolve(1) // waiting for next tick

    actual.push(
      yield io.flush(xChan),
      yield io.flush(yChan)
    )
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [[], [{ type: 'y' }]];

  setTimeout(() => {
    assert.deepEqual(actual, expected,
      "processor must not run effects when already completed"
    );
    assert.end();
  })
});
