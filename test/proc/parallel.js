import test from 'tape'
import { END } from '../../src'
import proc from '../../src/internal/proc'
import { deferred, arrayOfDeferred } from '../../src/utils'
import * as io from '../../src/effects'

test('processor array of effects handling', assert => {
  assert.plan(1)

  let actual
  const def = deferred()

  let cpsCb = {}
  const cps = (val, cb) => (cpsCb = { val, cb })

  const input = cb => {
    Promise.resolve(1)
      .then(() => def.resolve(1))
      .then(() => cpsCb.cb(null, cpsCb.val))
      .then(() => cb({ type: 'action' }))
    return () => {}
  }

  function* genFn() {
    actual = yield io.all([def.promise, io.cps(cps, 2), io.take('action')])
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = [1, 2, { type: 'action' }]

  setTimeout(() => {
    assert.deepEqual(actual, expected, 'processor must fullfill parallel effects')
    assert.end()
  })
})

test('processor empty array', assert => {
  assert.plan(1)

  let actual

  const input = () => {
    return () => {}
  }

  function* genFn() {
    actual = yield io.all([])
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  const expected = []

  setTimeout(() => {
    assert.deepEqual(actual, expected, 'processor must fullfill empty parallel effects with an empty array')
    assert.end()
  })
})

test('processor array of effect: handling errors', assert => {
  assert.plan(1)

  let actual
  const defs = arrayOfDeferred(2)

  Promise.resolve(1)
    .then(() => defs[0].reject('error'))
    .then(() => defs[1].resolve(1))

  function* genFn() {
    try {
      actual = yield io.all([defs[0].promise, defs[1].promise])
    } catch (err) {
      actual = [err]
    }
  }

  proc(genFn()).done.catch(err => assert.fail(err))

  const expected = ['error']

  setTimeout(() => {
    assert.deepEqual(actual, expected, 'processor must catch the first error in parallel effects')
    assert.end()
  })
})

test('processor array of effect: handling END', assert => {
  assert.plan(1)

  let actual
  const def = deferred()
  const input = cb => {
    Promise.resolve(1)
      .then(() => def.resolve(1))
      .then(() => cb(END))

    return () => {}
  }

  function* genFn() {
    try {
      actual = yield io.all([def.promise, io.take('action')])
    } finally {
      actual = 'end'
    }
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  setTimeout(() => {
    assert.deepEqual(actual, 'end', 'processor must end Parallel Effect if one of the effects resolve with END')
    assert.end()
  })
})

test('processor array of effect: named effects', assert => {
  assert.plan(1)

  let actual
  const def = deferred()
  const input = cb => {
    Promise.resolve(1)
      .then(() => def.resolve(1))
      .then(() => cb({ type: 'action' }))

    return () => {}
  }

  function* genFn() {
    actual = yield io.all({
      ac: io.take('action'),
      prom: def.promise,
    })
  }

  proc(genFn(), input).done.catch(err => assert.fail(err))

  setTimeout(() => {
    const expected = { ac: { type: 'action' }, prom: 1 }
    assert.deepEqual(actual, expected, 'processor must handle parallel named effects')
    assert.end()
  })
})
