import { createStore, applyMiddleware } from 'redux'
import sagaMiddleware from '../../src'
import * as io from '../../src/effects'
import nock from 'nock'
test('saga handles fetch effects and resume with the resolved values', () => {
  let actual = []
  const middleware = sagaMiddleware()
  createStore(() => ({}), {}, applyMiddleware(middleware))

  const url = 'https://redux-saga.js.org'
  nock(url)
    .get('/docs/api')
    .reply(200, {
      result: 1,
    })

  function* genFn() {
    console.log(url)
    const resp = yield io.fetch(`${url}/docs/api`)
    const data = yield io.call([resp, 'json'])
    actual.push(data)
  }

  const task = middleware.run(genFn)
  const expected = [{ result: 1 }]
  return task.toPromise().then(() => {
    // saga must fulfill declarative call effects
    expect(actual).toEqual(expected)
  })
})
