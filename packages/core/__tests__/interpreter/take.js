import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware, { channel, END, eventChannel } from '../../src'
import * as io from '../../src/effects'
import mitt from 'mitt'
test('saga take from default channel', () => {
  const middleware = sagaMiddleware()
  const store = applyMiddleware(middleware)(createStore)(() => {})
  const typeSymbol = Symbol('action-symbol')
  let actual = []

  function* genFn() {
    try {
      actual.push(yield io.take()) // take all actions

      actual.push(yield io.take('action-1')) // take only actions of type 'action-1'

      actual.push(yield io.take(['action-2', 'action-2222'])) // take either type

      actual.push(yield io.take(a => a.isAction)) // take if match predicate

      actual.push(yield io.take(['action-3', a => a.isMixedWithPredicate])) // take if match any from the mixed array

      actual.push(yield io.take(['action-3', a => a.isMixedWithPredicate])) // take if match any from the mixed array

      actual.push(yield io.take(typeSymbol)) // take only actions of a Symbol type

      actual.push(yield io.take('never-happening-action')) //  should get END
      // TODO: never-happening-action replaced with such case is not working
      // END is not handled properly on channels?
      // const chan = channel()
      // actual.push( yield io.take(chan) ) //  should get END
    } finally {
      actual.push('auto ended')
    }
  }

  const taskP = middleware.run(genFn).toPromise()
  const expected = [
    {
      type: 'action-*',
    },
    {
      type: 'action-1',
    },
    {
      type: 'action-2',
    },
    {
      type: '',
      isAction: true,
    },
    {
      type: '',
      isMixedWithPredicate: true,
    },
    {
      type: 'action-3',
    },
    {
      type: typeSymbol,
    },
    'auto ended',
  ]
  const scenarioP = Promise.resolve(1)
    .then(() =>
      store.dispatch({
        type: 'action-*',
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'action-1',
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'action-2',
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'unnoticeable-action',
      }),
    )
    .then(() =>
      store.dispatch({
        type: '',
        isAction: true,
      }),
    )
    .then(() =>
      store.dispatch({
        type: '',
        isMixedWithPredicate: true,
      }),
    )
    .then(() =>
      store.dispatch({
        type: 'action-3',
      }),
    )
    .then(() =>
      store.dispatch({
        type: typeSymbol,
      }),
    )
    .then(() =>
      store.dispatch({
        ...END,
        timestamp: Date.now(),
      }),
    ) // see #316
    .then(() => {
      // saga must fulfill take Effects from default channel
      expect(actual).toEqual(expected)
    })

  return Promise.all([taskP, scenarioP])
})
test('saga take from provided channel', () => {
  const chan = channel()
  let actual = []
  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    actual.push(yield io.takeMaybe(chan))
    actual.push(yield io.takeMaybe(chan))
    actual.push(yield io.takeMaybe(chan))
    actual.push(yield io.takeMaybe(chan))
    actual.push(yield io.takeMaybe(chan))
    actual.push(yield io.takeMaybe(chan))
  }

  const task = middleware.run(genFn)
  const expected = [1, 2, 3, 4, END, END]
  return Promise.resolve()
    .then(() => chan.put(1))
    .then(() => chan.put(2))
    .then(() => chan.put(3))
    .then(() => chan.put(4))
    .then(() => chan.close())
    .then(() => task.toPromise())
    .then(() => {
      // saga must fulfill take Effects from a provided channel
      expect(actual).toEqual(expected)
    })
})
test('saga take from eventChannel', () => {
  const em = mitt()
  const error = new Error('ERROR')
  const chan = eventChannel(emit => {
    em.on('*', emit)
    return () => em.off('*', emit)
  })
  let actual = []
  const middleware = sagaMiddleware()
  applyMiddleware(middleware)(createStore)(() => {})

  function* genFn() {
    try {
      actual.push(yield io.take(chan))
      actual.push(yield io.take(chan))
      actual.push(yield io.take(chan))
    } catch (e) {
      actual.push('in-catch-block')
      actual.push(e)
    }
  }

  const task = middleware.run(genFn)
  const expected = ['action-1', 'action-2', 'in-catch-block', error]
  return Promise.resolve()
    .then(() => em.emit('action-1'))
    .then(() => em.emit('action-2'))
    .then(() => em.emit(error))
    .then(() => em.emit('action-after-error'))
    .then(() => task.toPromise())
    .then(() => {
      // saga must take payloads from the eventChannel, and errors from eventChannel will make the saga jump to the catch block
      expect(actual).toEqual(expected)
    })
})
