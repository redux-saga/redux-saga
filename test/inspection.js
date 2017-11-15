import test from 'tape'
import * as io from '../src/effects'
import { inspection } from '../src/inspection'
const {
  fn,
  args,
  context,
  channel,
  action,
  resolve,
  pattern,
  buffer,
  detached,
  selector,
  maybe,
  task,
  effects,
  prop,
  props,
} = inspection

test('fn inspection util', assert => {
  const myFn = i => i
  assert.equal(fn(io.call(myFn)), myFn)
  assert.equal(fn(io.fork(myFn)), myFn)
  assert.equal(fn(io.cps(myFn)), myFn)
  assert.false(fn(io.put({ type: 'FOO' })))
  assert.end()
})

test('args inspection util', assert => {
  const myFn = i => i
  const arg0 = 1
  const arg1 = 2
  const myArgs = [arg0, arg1]
  assert.deepEqual(args(io.call(myFn, arg0, arg1)), myArgs)
  assert.deepEqual(args(io.fork(myFn, arg0, arg1)), myArgs)
  assert.deepEqual(args(io.cps(myFn, arg0, arg1)), myArgs)
  assert.deepEqual(args(io.select(myFn, arg0, arg1)), myArgs)
  assert.false(args(io.put({ type: 'FOO' })))
  assert.end()
})

test('context inspection util', assert => {
  const myFn = i => i
  const myContext = i => i
  assert.equal(context(io.call([myContext, myFn])), myContext)
  assert.equal(context(io.fork([myContext, myFn])), myContext)
  assert.equal(context(io.cps([myContext, myFn])), myContext)
  assert.false(context(io.put({ type: 'FOO' })))
  assert.end()
})

test('channel inspection util', assert => {
  const myChannel = {
    take: i => i,
    put: 'FOO',
    flush: i => i,
    close: i => i,
    multicast: true,
  }
  assert.equal(channel(io.flush(myChannel)), myChannel)
  assert.equal(channel(io.put(myChannel, { type: 'FOO' })), myChannel)
  assert.equal(channel(io.take(myChannel, '*')), myChannel)
  assert.false(channel(io.call(i => i)))
  assert.end()
})

test('action inspection util', assert => {
  const myAction = { type: 'FOO' }
  assert.deepEqual(action(io.put(myAction)), myAction)
  assert.false(action(io.call(i => i)))
  assert.end()
})

test('resolve inspection util', assert => {
  const myAction = { type: 'FOO' }
  assert.equal(resolve(io.putResolve(myAction)), true)
  assert.false(resolve(io.call(i => i)))
  assert.end()
})

test('pattern inspection util', assert => {
  const myPattern = '*'
  assert.equal(pattern(io.take(myPattern)), '*')
  assert.equal(pattern(io.actionChannel(myPattern)), '*')
  assert.false(pattern(io.call(i => i)))
  assert.end()
})

test('buffer inspection util', assert => {
  const myBuffer = {
    take: () => true,
    isEmpty: () => true,
    put: () => {},
  }
  assert.equal(buffer(io.actionChannel('*', myBuffer)), myBuffer)
  assert.false(buffer(io.call(i => i)))
  assert.end()
})

test('detached inspection util', assert => {
  assert.equal(detached(io.spawn(i => i)), true)
  assert.false(detached(io.call(i => i)))
  assert.end()
})

test('selector inspection util', assert => {
  const mySelector = i => i
  assert.equal(selector(io.select(mySelector)), mySelector)
  assert.false(selector(io.call(i => i)))
  assert.end()
})

test('maybe inspection util', assert => {
  assert.equal(maybe(io.takeMaybe('FOO')), true)
  assert.false(selector(io.call(i => i)))
  assert.end()
})

test('task inspection util', assert => {
  const myTask = 'FOO'
  assert.equal(task(io.cancel(myTask)), myTask)
  assert.equal(task(io.join(myTask)), myTask)
  assert.false(task(io.call(i => i)))
  assert.end()
})

test('effects inspection util', assert => {
  const myEffects = [io.call(i => i), io.fork(i => i)]
  assert.deepEqual(effects(io.all(myEffects)), myEffects)
  assert.deepEqual(effects(io.race(myEffects)), myEffects)
  assert.false(effects(io.call(i => i)))
  assert.end()
})

test('prop inspection util', assert => {
  const myProp = 'foo'
  assert.equal(prop(io.getContext(myProp)), myProp)
  assert.false(prop(io.call(i => i)))
  assert.end()
})

test('props inspection util', assert => {
  const myProps = { a: 1, b: 2 }
  assert.deepEqual(props(io.setContext(myProps)), myProps)
  assert.false(props(io.call(i => i)))
  assert.end()
})
