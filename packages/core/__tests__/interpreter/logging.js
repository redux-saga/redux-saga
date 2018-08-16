import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
test('saga logging', () => {
  let actual = []
  const middleware = sagaMiddleware({
    logger: (level, ...args) => {
      actual.push([level, args.join(' ')])
    },
  })
  createStore(() => ({}), {}, applyMiddleware(middleware))

  function* child() {
    throw new Error('child error')
  }

  function* main() {
    yield io.call(child)
  }

  const task = middleware.run(main)
  return task.toPromise().catch(err => {
    const loggedError = actual[0]
    expect(loggedError[0]).toBe('error')
    expect(loggedError[1].indexOf(err.message) >= 0).toBe(true)
  })
})
