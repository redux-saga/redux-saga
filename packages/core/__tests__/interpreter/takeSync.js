/* eslint-disable no-unused-vars, no-constant-condition */
import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { END } from '../../src'
import { take, put, fork, join, call, all, race, cancel, takeEvery, delay } from '../../src/effects'
import { channel, buffers } from '../../src'

test('synchronous sequential takes', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* fnA() {
    actual.push(yield take('a1'))
    actual.push(yield take('a3'))
  }

  function* fnB() {
    actual.push(yield take('a2'))
  }

  function* root() {
    yield fork(fnA)
    yield fork(fnB)
  }

  store.dispatch({
    type: 'a1',
  })
  store.dispatch({
    type: 'a2',
  })
  store.dispatch({
    type: 'a3',
  })
  return Promise.resolve().then(() => {
    // Sagas must take consecutive actions dispatched synchronously
    expect(actual).toEqual([
      {
        type: 'a1',
      },
      {
        type: 'a2',
      },
      {
        type: 'a3',
      },
    ])
  })
})

test('synchronous concurrent takes', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)
  /**
    If a1 wins, then a2 cancellation means it will not take the next 'a2' action,
    dispatched immediately by the store after 'a1'; so the 2n take('a2') should take it
  **/

  function* root() {
    actual.push(
      yield race({
        a1: take('a1'),
        a2: take('a2'),
      }),
    )
    actual.push(yield take('a2'))
  }

  store.dispatch({
    type: 'a1',
  })
  store.dispatch({
    type: 'a2',
  })

  return Promise.resolve().then(() => {
    // In concurrent takes only the winner must take an action
    expect(actual).toEqual([
      {
        a1: {
          type: 'a1',
        },
      },
      {
        type: 'a2',
      },
    ])
  })
})

test('synchronous parallel takes', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    actual.push(yield all([take('a1'), take('a2')]))
  }

  store.dispatch({
    type: 'a1',
  })
  store.dispatch({
    type: 'a2',
  })

  return Promise.resolve().then(() => {
    // Saga must resolve once all parallel actions dispatched
    expect(actual).toEqual([
      [
        {
          type: 'a1',
        },
        {
          type: 'a2',
        },
      ],
    ])
  })
})

test('synchronous parallel + concurrent takes', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  middleware.run(root)

  function* root() {
    actual.push(
      yield all([
        race({
          a1: take('a1'),
          a2: take('a2'),
        }),
        take('a2'),
      ]),
    )
  }

  store.dispatch({
    type: 'a1',
  })
  store.dispatch({
    type: 'a2',
  })

  return Promise.resolve().then(() => {
    // Saga must resolve once all parallel actions dispatched
    expect(actual).toEqual([
      [
        {
          a1: {
            type: 'a1',
          },
        },
        {
          type: 'a2',
        },
      ],
    ])
  })
}) //see https://github.com/reactjs/redux/issues/1240

test('startup actions', () => {
  const actual = []

  function reducer(state, action) {
    if (action.type === 'a') actual.push(action.payload)
    return true
  }

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))
  middleware.run(fnA)
  middleware.run(fnB)
  /*
    Saga starts dispatching actions immediately after being started
    But since sagas are started immediately by the saga middleware
    It means saga will dispatch actions while the store creation
    is still running (applyMiddleware has not yet returned)
  */

  function* fnB() {
    yield put({
      type: 'a',
      payload: 1,
    })
    yield put({
      type: 'a',
      payload: 2,
    })
    yield put({
      type: 'a',
      payload: 3,
    })
  }

  function* fnA() {
    actual.push('fnA-' + (yield take('a')).payload)
  }

  return Promise.resolve().then(() => {
    // Saga must be able to dispatch startup actions
    expect(actual).toEqual([1, 'fnA-1', 2, 3])
  })
})
test('synchronous takes + puts', () => {
  const actual = []

  function reducer(state, action) {
    if (action.type === 'a') actual.push(action.payload)
    return true
  }

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))
  middleware.run(root)

  function* root() {
    yield take('a')
    yield put({
      type: 'a',
      payload: 'ack-1',
    })
    yield take('a')
    yield put({
      type: 'a',
      payload: 'ack-2',
    })
  }

  store.dispatch({
    type: 'a',
    payload: 1,
  })
  store.dispatch({
    type: 'a',
    payload: 2,
  })

  return Promise.resolve().then(() => {
    // Sagas must be able to interleave takes and puts without losing actions
    expect(actual).toEqual([1, 'ack-1', 2, 'ack-2'])
  })
})

test('synchronous takes (from a channel) + puts (to the store)', () => {
  const actual = []
  const chan = channel()

  function reducer(state, action) {
    if (action.type === 'a') actual.push(action.payload)
    return true
  }

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))
  middleware.run(root)

  function* root() {
    actual.push((yield take(chan, 'a')).payload)
    yield put({
      type: 'a',
      payload: 'ack-1',
    })
    actual.push((yield take(chan, 'a')).payload)
    yield put({
      type: 'a',
      payload: 'ack-2',
    })
    yield take('never-happening-action')
  }

  chan.put({
    type: 'a',
    payload: 1,
  })
  chan.put({
    type: 'a',
    payload: 2,
  })
  chan.close()

  return Promise.resolve().then(() => {
    // Sagas must be able to interleave takes (from a channel) and puts (to the store) without losing actions
    expect(actual).toEqual([1, 'ack-1', 2, 'ack-2'])
  })
}) // see #50

test('inter-saga put/take handling', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))
  middleware.run(root)

  function* fnA() {
    while (true) {
      let { payload } = yield take('a')
      yield fork(someAction, payload)
    }
  }

  function* fnB() {
    yield put({
      type: 'a',
      payload: 1,
    })
    yield put({
      type: 'a',
      payload: 2,
    })
    yield put({
      type: 'a',
      payload: 3,
    })
  }

  function* someAction(payload) {
    actual.push(payload)
  }

  function* root() {
    yield all([fork(fnA), fork(fnB)])
  }

  return Promise.resolve().then(() => {
    // Sagas must take actions from each other
    expect(actual).toEqual([1, 2, 3])
  })
})

test('inter-saga put/take handling (via buffered channel)', () => {
  const actual = []
  const chan = channel()
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))

  function* fnA() {
    while (true) {
      let action = yield take(chan)
      yield call(someAction, action)
    }
  }

  function* fnB() {
    yield put(chan, 1)
    yield put(chan, 2)
    yield put(chan, 3)
    yield call(chan.close)
  }

  function* someAction(action) {
    actual.push(action)
    yield Promise.resolve()
  }

  function* root() {
    yield all([fork(fnA), fork(fnB)])
  }

  return middleware
    .run(root)
    .toPromise()
    .then(() => {
      // Sagas must take actions from each other (via buffered channel)
      expect(actual).toEqual([1, 2, 3])
    })
})
test('inter-saga send/acknowledge handling', () => {
  const actual = []

  const push = ({ type }) => actual.push(type)

  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))
  middleware.run(root)

  function* fnA() {
    push(yield take('msg-1'))
    yield put({
      type: 'ack-1',
    })
    push(yield take('msg-2'))
    yield put({
      type: 'ack-2',
    })
  }

  function* fnB() {
    yield put({
      type: 'msg-1',
    })
    push(yield take('ack-1'))
    yield put({
      type: 'msg-2',
    })
    push(yield take('ack-2'))
  }

  function* root() {
    yield all([fork(fnA), fork(fnB)])
  }

  return Promise.resolve().then(() => {
    // Sagas must take actions from each other in the right order
    expect(actual).toEqual(['msg-1', 'ack-1', 'msg-2', 'ack-2'])
  })
})
test('inter-saga send/acknowledge handling (via unbuffered channel)', () => {
  const actual = [] // non buffered channel must behave like the store

  const chan = channel(buffers.none())
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))
  middleware.run(root)

  function* fnA() {
    actual.push(yield take(chan))
    yield put(chan, 'ack-1')
    actual.push(yield take(chan))
    yield put(chan, 'ack-2')
  }

  function* fnB() {
    yield put(chan, 'msg-1')
    actual.push(yield take(chan))
    yield put(chan, 'msg-2')
    actual.push(yield take(chan))
  }

  function* root() {
    yield fork(fnA)
    yield fork(fnB)
  }

  return Promise.resolve().then(() => {
    // Sagas must take actions from each other (via unbuffered channel) in the right order
    expect(actual).toEqual(['msg-1', 'ack-1', 'msg-2', 'ack-2'])
  })
})
test('inter-saga send/acknowledge handling (via buffered channel)', () => {
  const actual = []
  const chan = channel()
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))

  function* fnA() {
    actual.push(yield take(chan))
    yield put(chan, 'ack-1')
    yield Promise.resolve()
    actual.push(yield take(chan))
    yield put(chan, 'ack-2')
  }

  function* fnB() {
    yield put(chan, 'msg-1')
    yield Promise.resolve()
    actual.push(yield take(chan))
    yield put(chan, 'msg-2')
    yield Promise.resolve()
    actual.push(yield take(chan))
  }

  function* root() {
    yield fork(fnB)
    yield fork(fnA)
  }

  return middleware
    .run(root)
    .toPromise()
    .then(() => {
      // Sagas must take actions from each other (via buffered channel) in the right order
      expect(actual).toEqual(['msg-1', 'ack-1', 'msg-2', 'ack-2'])
    })
})
test('inter-saga fork/take back from forked child 1', () => {
  const actual = []
  const chan = channel()
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))

  function* root() {
    yield all([takeEvery('TEST', takeTest1), takeEvery('TEST2', takeTest2)])
  }

  let testCounter = 0

  function* takeTest1(action) {
    if (testCounter === 0) {
      actual.push(1)
      testCounter++
      yield put({
        type: 'TEST2',
      })
    } else {
      actual.push(++testCounter)
    }
  }

  function* takeTest2(action) {
    yield all([fork(forkedPut1), fork(forkedPut2)])
  }

  function* forkedPut1() {
    yield put({
      type: 'TEST',
    })
  }

  function* forkedPut2() {
    yield put({
      type: 'TEST',
    })
  }

  const task = middleware.run(root)

  store.dispatch({
    type: 'TEST',
  })
  store.dispatch(END)

  return task.toPromise().then(() => {
    // Sagas must take actions from each forked childs doing Sync puts
    expect(actual).toEqual([1, 2, 3])
  })
})
test('deeply nested forks/puts', () => {
  const actual = []
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))

  function* s1() {
    yield fork(s2)
    actual.push(yield take('a2'))
  }

  function* s2() {
    yield fork(s3)
    actual.push(yield take('a3'))
    yield put({
      type: 'a2',
    })
  }

  function* s3() {
    yield put({
      type: 'a3',
    })
  }

  middleware.run(s1) // must schedule deeply nested forks/puts

  expect(actual).toEqual([
    {
      type: 'a3',
    },
    {
      type: 'a2',
    },
  ])
}) // #413

test('inter-saga fork/take back from forked child 2', () => {
  const actual = []
  const chan = channel()
  const middleware = sagaMiddleware()
  const store = createStore(() => {}, applyMiddleware(middleware))
  let first = true

  function* root() {
    yield takeEvery('PING', ackWorker)
  }

  function* ackWorker(action) {
    if (first) {
      first = false
      yield put({
        type: 'PING',
        val: action.val + 1,
      })
      yield take(`ACK-${action.val + 1}`)
    }

    yield put({
      type: `ACK-${action.val}`,
    })
    actual.push(1)
  }

  const task = middleware.run(root)

  store.dispatch({
    type: 'PING',
    val: 0,
  })
  store.dispatch(END)

  return task.toPromise().then(() => {
    // Sagas must take actions from each forked childs doing Sync puts
    expect(actual).toEqual([1, 1])
  })
})
test('put causing sync dispatch response in store subscriber', () => {
  const reducer = (state, action) => action.type

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))
  const actual = []
  middleware.run(root)
  store.subscribe(() => {
    if (store.getState() === 'c')
      store.dispatch({
        type: 'b',
        test: true,
      })
  })
  store.dispatch({
    type: 'a',
    test: true,
  })

  function* root() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { a, b } = yield race({
        a: take('a'),
        b: take('b'),
      })
      actual.push(a ? a.type : b.type)

      if (a) {
        yield put({
          type: 'c',
          test: true,
        })
        continue
      }

      yield put({
        type: 'd',
        test: true,
      })
    }
  }

  return Promise.resolve().then(() => {
    // Sagas can't miss actions dispatched by store subscribers during put handling
    expect(actual).toEqual(['a', 'b'])
  })
})

test('action dispatched in root saga should get scheduled and taken by a "sibling" take', () => {
  const reducer = (state, action) => {
    if (!state) return []

    return state.concat(action.type)
  }

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))

  function* root() {
    yield all([
      put({ type: 'FIRST' }),
      takeEvery('FIRST', function*() {
        yield put({ type: 'SECOND' })
      }),
    ])
  }

  middleware.run(root)

  return Promise.resolve().then(() => {
    expect(store.getState()).toEqual(['FIRST', 'SECOND'])
  })
})

test('action dispatched synchronously in forked task should be taken a following sync take', () => {
  const actual = []
  const reducer = (state, action) => action.type

  const middleware = sagaMiddleware()
  const store = createStore(reducer, applyMiddleware(middleware))

  function* root() {
    // force async, otherwise sync root startup prevents this from being tested appropriately
    // as the scheduler is in suspended state because of it
    yield delay(10)
    yield fork(function*() {
      yield put({ type: 'A', payload: 'foo' })
    })
    actual.push(yield take('A'))
  }

  return middleware
    .run(root)
    .toPromise()
    .then(() => {
      expect(actual).toEqual([{ type: 'A', payload: 'foo' }])
    })
})
