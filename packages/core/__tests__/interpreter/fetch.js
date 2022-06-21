import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
import nock from 'nock'
test('saga handles fetch effects and resume with the resolved values', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  console.log(nock)
  nock('/').get('/users').reply(200, {
    result: 1,
  })

  function* genFn() {
    actual.push(yield io.fetch('/users'))
  }

  const task = middleware.run(genFn)
  const expected = [{ result: 1 }]
  return task.toPromise().then(() => {
    // saga must fulfill declarative call effects
    expect(actual).toEqual(expected)
  })
})
