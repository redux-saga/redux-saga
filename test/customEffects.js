import test from 'tape'

import { runSaga, effect, payload } from '../src'
import { fork, take, put } from '../src/effects'
import { emitter } from '../src/internal/channel'
import { is } from '../src/internal/utils'

const CUSTOM = 'CUSTOM'
const CUSTOM2 = 'CUSTOM2'
const CUSTOM3 = 'CUSTOM3'

const custom = () => effect(CUSTOM, {})
const custom2 = () => effect(CUSTOM2, {})
const custom3 = (message) => effect(CUSTOM3, { message })

function* runCustom() {
  yield put({type: 'CUSTOM'})
}

function* runCustom2() {
  yield put({type: 'CUSTOM-2'})
}

function* runCustom3({message}) {
  yield put({type: 'CUSTOM-3', payload: { message }})
}

const runners = {
  custom    : runCustom,
  custom2   : runCustom2,
  custom3   : runCustom3
}

function storeLike(reducer, state) {
  const em = emitter()

  return {
    subscribe: em.subscribe,
    dispatch: (action) => {
      state = reducer(state, action)
      em.emit(action)
      return action
    },
    getState: () => state
  }
}

test('customEffects', assert => {
  assert.plan(1)

  let actual = []

  function* customEffectRunner(effect) {
    let data;
    yield* (
        is.notUndef(data = payload(CUSTOM, effect))  ? runners.custom(data)
      : is.notUndef(data = payload(CUSTOM2, effect)) ? runners.custom2(data) 
      : is.notUndef(data = payload(CUSTOM3, effect)) ? runners.custom3(data)
      : function* () { throw new Error('Unable to locate custom effect runner') }
    );
  }

  const store = storeLike((s = {}, a) => a, {})
  const task = runSaga(root(), {...store, customEffectRunner})

  function* root() {
    yield [fork(fnA), fork(fnB)]
  }

  function* fnA() {
    actual.push( yield take('CUSTOM') )
    actual.push( yield take('CUSTOM-2') )
    actual.push( yield take('CUSTOM-3') )
  }

  function* fnB() {
    yield custom();
    yield custom2();
    yield custom3('TEST MESSAGE');
  }

  const expected = [
    {type: 'CUSTOM'}, 
    {type: 'CUSTOM-2'},
    {type: 'CUSTOM-3', payload: { message: 'TEST MESSAGE' }}
  ]

  task.done.then(() => {
    assert.deepEqual(actual, expected,
      'runSaga must run custom declarative effects'
    )}
  )

  task.done.catch(err => assert.fail(err))
})
