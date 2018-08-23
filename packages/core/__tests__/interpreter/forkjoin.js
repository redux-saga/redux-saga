import deferred from '@redux-saga/deferred'
import * as is from '@redux-saga/is'
import { arrayOfDeferred } from '@redux-saga/deferred'
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
test('saga fork handling: generators', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  let task, task2

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

  const mainTask = middleware.run(genFn)
  return mainTask
    .toPromise()
    .then(() => {
      // fork result must include the name of the forked generator function
      expect(task.meta.name).toBe('subGen') // fork result must include the promise of the task result

      expect(is.promise(task.toPromise())).toBe(true)

      return Promise.all([
        // fork result must resolve with the return value of the forked task
        task.toPromise(),
        // fork must also handle generators defined as instance methods
        task2.toPromise(),
      ])
    })
    .then(res => {
      expect(res).toEqual([1, 2])
    })
})
test('saga join handling : generators', () => {
  let actual = []
  const defs = arrayOfDeferred(2)
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})

  function* subGen(arg) {
    yield defs[1].promise // will be resolved after the action-1

    return arg
  }

  function* genFn() {
    const task = yield io.fork(subGen, 1)
    actual.push(yield defs[0].promise)
    actual.push(yield io.take('action-1'))
    actual.push(yield io.join(task))
  }

  const task = middleware.run(genFn)
  Promise.resolve(1)
    .then(() => defs[0].resolve(true))
    .then(() =>
      store.dispatch({
        type: 'action-1',
      }),
    )
    .then(() => defs[1].resolve(2)) // the result of the fork will be resolved the last
  // saga must not block and miss the 2 precedent effects

  const expected = [
    true,
    {
      type: 'action-1',
    },
    1,
  ]
  return task.toPromise().then(() => {
    // saga must not block on forked tasks, but block on joined tasks
    expect(actual).toEqual(expected)
  })
})
test('saga fork/join handling : functions', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const defs = arrayOfDeferred(2)
  Promise.resolve(1)
    .then(() => defs[0].resolve(true))
    .then(() => defs[1].resolve(2))

  function api() {
    return defs[1].promise
  }

  function syncFn() {
    return 'sync'
  }

  function* genFn() {
    const task = yield io.fork(api)
    const syncTask = yield io.fork(syncFn)
    actual.push(yield defs[0].promise)
    actual.push(yield io.join(task))
    actual.push(yield io.join(syncTask))
  }

  const task = middleware.run(genFn)
  const expected = [true, 2, 'sync']
  return task.toPromise().then(() => {
    // saga must not block on forked tasks, but block on joined tasks
    expect(actual).toEqual(expected)
  })
})
test('saga fork wait for attached children', () => {
  const actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const rootDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeferred(4)
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
  }

  function* leaf(idx) {
    yield defs[idx].promise
    actual.push(idx)
  }

  const task = middleware.run(root)
  return task.toPromise().then(() => {
    // parent task must wait for all forked tasks before terminating
    expect(actual).toEqual([0, 2, 3, 1])
  })
})
test('saga auto cancel forks on error', () => {
  const actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeferred(4)
  Promise.resolve()
    .then(() => childAdef.resolve('childA resolved'))
    .then(() => defs[0].resolve('leaf 1 resolved'))
    .then(() => childBdef.resolve('childB resolved'))
    .then(() => defs[1].resolve('leaf 2 resolved'))
    .then(() => mainDef.reject('main error')) //
    .then(() => defs[2].resolve('leaf 3 resolved'))
    .then(() => defs[3].resolve('leaf 4 resolved'))

  function* root() {
    try {
      actual.push(yield io.call(main))
    } catch (e) {
      actual.push('root caught ' + e)
    }
  }

  function* main() {
    try {
      yield io.fork(childA)
      yield io.fork(childB)
      actual.push(yield mainDef.promise)
    } catch (e) {
      actual.push(e)
      throw e
    } finally {
      if (yield io.cancelled()) actual.push('main cancelled')
    }
  }

  function* childA() {
    try {
      yield io.fork(leaf, 0)
      actual.push(yield childAdef.promise)
      yield io.fork(leaf, 1)
    } finally {
      if (yield io.cancelled()) actual.push('childA cancelled')
    }
  }

  function* childB() {
    try {
      yield io.fork(leaf, 2)
      yield io.fork(leaf, 3)
      actual.push(yield childBdef.promise)
    } finally {
      if (yield io.cancelled()) actual.push('childB cancelled')
    }
  }

  function* leaf(idx) {
    try {
      actual.push(yield defs[idx].promise)
    } finally {
      if (yield io.cancelled()) actual.push(`leaf ${idx + 1} cancelled`)
    }
  }

  const task = middleware.run(root)
  const expected = [
    'childA resolved',
    'leaf 1 resolved',
    'childB resolved',
    'leaf 2 resolved',
    'main error',
    'leaf 3 cancelled',
    'leaf 4 cancelled',
    'root caught main error',
  ]
  return task.toPromise().then(() => {
    // parent task must cancel all forked tasks when it aborts
    expect(actual).toEqual(expected)
  })
})
test('saga auto cancel forks on main cancelled', () => {
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const actual = []
  const rootDef = deferred()
  const mainDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeferred(4)
  Promise.resolve()
    .then(() => childAdef.resolve('childA resolved'))
    .then(() => defs[0].resolve('leaf 1 resolved'))
    .then(() => childBdef.resolve('childB resolved'))
    .then(() => defs[1].resolve('leaf 2 resolved'))
    .then(() => rootDef.resolve('root resolved'))
    .then(() => mainDef.resolve('main resolved'))
    .then(() => defs[2].resolve('leaf 3 resolved'))
    .then(() => defs[3].resolve('leaf 4 resolved'))

  function* root() {
    try {
      const task = yield io.fork(main)
      actual.push(yield rootDef.promise)
      yield io.cancel(task)
    } catch (e) {
      actual.push('root caught ' + e)
    }
  }

  function* main() {
    try {
      yield io.fork(childA)
      yield io.fork(childB)
      actual.push(yield mainDef.promise)
    } finally {
      if (yield io.cancelled()) actual.push('main cancelled')
    }
  }

  function* childA() {
    try {
      yield io.fork(leaf, 0)
      actual.push(yield childAdef.promise)
      yield io.fork(leaf, 1)
    } finally {
      if (yield io.cancelled()) actual.push('childA cancelled')
    }
  }

  function* childB() {
    try {
      yield io.fork(leaf, 2)
      yield io.fork(leaf, 3)
      actual.push(yield childBdef.promise)
    } finally {
      if (yield io.cancelled()) actual.push('childB cancelled')
    }
  }

  function* leaf(idx) {
    try {
      actual.push(yield defs[idx].promise)
    } finally {
      if (yield io.cancelled()) actual.push(`leaf ${idx + 1} cancelled`)
    }
  }

  const task = middleware.run(root)
  const expected = [
    'childA resolved',
    'leaf 1 resolved',
    'childB resolved',
    'leaf 2 resolved',
    'root resolved',
    'main cancelled',
    'leaf 3 cancelled',
    'leaf 4 cancelled',
  ]
  return task.toPromise().then(() => {
    // parent task must cancel all forked tasks when it's cancelled
    expect(actual).toEqual(expected)
  })
})
test('saga auto cancel forks if a child aborts', () => {
  const actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeferred(4)
  Promise.resolve()
    .then(() => childAdef.resolve('childA resolved'))
    .then(() => defs[0].resolve('leaf 1 resolved'))
    .then(() => childBdef.resolve('childB resolved'))
    .then(() => defs[1].resolve('leaf 2 resolved'))
    .then(() => mainDef.resolve('main resolved'))
    .then(() => defs[2].reject('leaf 3 error'))
    .then(() => defs[3].resolve('leaf 4 resolved'))

  function* root() {
    try {
      actual.push(yield io.call(main))
    } catch (e) {
      actual.push('root caught ' + e)
    }
  }

  function* main() {
    try {
      yield io.fork(childA)
      yield io.fork(childB)
      actual.push(yield mainDef.promise)
      return 'main returned'
    } finally {
      if (yield io.cancelled()) actual.push('main cancelled')
    }
  }

  function* childA() {
    try {
      yield io.fork(leaf, 0)
      actual.push(yield childAdef.promise)
      yield io.fork(leaf, 1)
    } finally {
      if (yield io.cancelled()) actual.push('childA cancelled')
    }
  }

  function* childB() {
    try {
      yield io.fork(leaf, 2)
      yield io.fork(leaf, 3)
      actual.push(yield childBdef.promise)
    } finally {
      if (yield io.cancelled()) actual.push('childB cancelled')
    }
  }

  function* leaf(idx) {
    try {
      actual.push(yield defs[idx].promise)
    } catch (e) {
      actual.push(e)
      throw e
    } finally {
      if (yield io.cancelled()) actual.push(`leaf ${idx + 1} cancelled`)
    }
  }

  const task = middleware.run(root)
  const expected = [
    'childA resolved',
    'leaf 1 resolved',
    'childB resolved',
    'leaf 2 resolved',
    'main resolved',
    'leaf 3 error',
    'leaf 4 cancelled',
    'root caught leaf 3 error',
  ]
  return task.toPromise().then(() => {
    // parent task must cancel all forked tasks when it aborts
    expect(actual).toEqual(expected)
  })
})
test('saga auto cancel parent + forks if a child aborts', () => {
  const actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))
  const mainDef = deferred()
  const childAdef = deferred()
  const childBdef = deferred()
  const defs = arrayOfDeferred(4)
  Promise.resolve()
    .then(() => childAdef.resolve('childA resolved'))
    .then(() => defs[0].resolve('leaf 1 resolved'))
    .then(() => childBdef.resolve('childB resolved'))
    .then(() => defs[1].resolve('leaf 2 resolved'))
    .then(() => defs[2].reject('leaf 3 error'))
    .then(() => mainDef.resolve('main resolved'))
    .then(() => defs[3].resolve('leaf 4 resolved'))

  function* root() {
    try {
      actual.push(yield io.call(main))
    } catch (e) {
      actual.push('root caught ' + e)
    }
  }

  function* main() {
    try {
      yield io.fork(childA)
      yield io.fork(childB)
      actual.push(yield mainDef.promise)
      return 'main returned'
    } catch (e) {
      actual.push(e)
      throw e
    } finally {
      if (yield io.cancelled()) actual.push('main cancelled')
    }
  }

  function* childA() {
    try {
      yield io.fork(leaf, 0)
      actual.push(yield childAdef.promise)
      yield io.fork(leaf, 1)
    } finally {
      if (yield io.cancelled()) actual.push('childA cancelled')
    }
  }

  function* childB() {
    try {
      yield io.fork(leaf, 2)
      yield io.fork(leaf, 3)
      actual.push(yield childBdef.promise)
    } finally {
      if (yield io.cancelled()) actual.push('childB cancelled')
    }
  }

  function* leaf(idx) {
    try {
      actual.push(yield defs[idx].promise)
    } catch (e) {
      actual.push(e)
      throw e
    } finally {
      if (yield io.cancelled()) actual.push(`leaf ${idx + 1} cancelled`)
    }
  }

  const task = middleware.run(root)
  const expected = [
    'childA resolved',
    'leaf 1 resolved',
    'childB resolved',
    'leaf 2 resolved',
    'leaf 3 error',
    'leaf 4 cancelled',
    'main cancelled',
    'root caught leaf 3 error',
  ]
  return task.toPromise().then(() => {
    // parent task must cancel all forked tasks when it aborts
    expect(actual).toEqual(expected)
  })
})
test('joining multiple tasks', () => {
  const defs = arrayOfDeferred(3)
  let actual
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* worker(i) {
    return yield defs[i].promise
  }

  function* genFn() {
    const task1 = yield io.fork(worker, 0)
    const task2 = yield io.fork(worker, 1)
    const task3 = yield io.fork(worker, 2)
    actual = yield io.join([task1, task2, task3])
  }

  const mainTask = middleware.run(genFn)
  Promise.resolve()
    .then(() => defs[0].resolve(1))
    .then(() => defs[2].resolve(3))
    .then(() => defs[1].resolve(2))
  const expected = [1, 2, 3]
  return mainTask.toPromise().then(() => {
    // it must be possible to join on multiple tasks
    expect(actual).toEqual(expected)
  })
})
