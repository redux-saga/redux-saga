import { take, put, race } from '../src/effects'

export const runSyncDispatchTest = (assert, store, runSaga) => {
  const actual = []

  assert.plan(1);

  runSaga(root)
  store.subscribe(() => {
    if (store.getState() === 'c')
      store.dispatch({type: 'b', test: true})
    })
  store.dispatch({type: 'a', test: true});

  function* root() {
    while (true) {
      const { a, b } = yield race({
        a: take('a'),
        b: take('b')
      })

      actual.push(a ? a.type : b.type)

      if (a) {
        yield put({type: 'c', test: true})
        continue
      }

      yield put({type: 'd', test: true})
    }
  }

  Promise.resolve().then(() => {
    assert.deepEqual(actual, ['a', 'b'],
      "Sagas can't miss actions dispatched by store subscribers during put handling"
    );
    assert.end();
  });
}
