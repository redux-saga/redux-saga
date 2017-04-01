import test from 'tape'

import { runSaga } from '../src'
import { fork, take, put } from '../src/effects'
import { emitter } from '../src/internal/channel'
import { is } from '../src/internal/utils'

const IO     = '@@redux-saga/IO'
const CUSTOM = 'CUSTOM'
const CUSTOM2 = 'CUSTOM2'
const CUSTOM3 = 'CUSTOM3'

const effect = (type, payload) => ({[IO]: true, [type]: payload})
const createAsEffectType = type => effect => effect && effect[IO] && effect[type]

function custom() {
  return effect(CUSTOM, {});
}

function custom2() {
  return effect(CUSTOM2, {});
}

function custom3(message) {
  return effect(CUSTOM3, { message });  
}

function* runCustom() {
  yield put({type: 'CUSTOM'})
}

function* runCustom2() {
  yield put({type: 'CUSTOM-2'})
}

function* runCustom3({message}) {
  yield put({type: 'CUSTOM-3', payload: { message }})
}

const asEffect = {
  custom    : createAsEffectType(CUSTOM),
  custom2   : createAsEffectType(CUSTOM2),
  custom3   : createAsEffectType(CUSTOM3)
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

  function* effectRunner(effect) {
    let data;
    yield* (
        is.notUndef(data = asEffect.custom(effect))  ? runners.custom(data)
      : is.notUndef(data = asEffect.custom2(effect)) ? runners.custom2(data) 
      : is.notUndef(data = asEffect.custom3(effect)) ? runners.custom3(data)
      : function* () { throw new Error('Unable to locate custom effect runner') }
    );
  }

  const effectManager = {
    asEffect  : (effect) => asEffect.custom(effect)  ||
                            asEffect.custom2(effect) ||
                            asEffect.custom3(effect),
    run       : effectRunner
  }

  const store = storeLike((s = {}, a) => a, {})
  const task = runSaga(root(), {...store, effectManager})

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
