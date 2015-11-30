import test from 'tape';

import saga, { callApi } from '../src/sagas'
import * as types from '../src/constants/ActionTypes'
import * as actions from '../src/actions'
import * as effects from '../src/constants/ServiceTypes'

const products = [1], cart = [1] // dummy values
const state = { products, cart }
const getState = () => state

test('getProducts Saga test', function (t) {

  const generator = saga( getState, actions.getAllProducts() )

  let nextRes = generator.next()
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, callApi(effects.GET_PRODUCTS))

  nextRes = generator.next(products) // resume with a dummy value
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, actions.receiveProducts(products))

  nextRes = generator.next()
  t.equal(nextRes.done, true)

  t.end()

});

test('checkout Saga test', function (t) {


  const generator = saga(getState, actions.checkout(products))

  let nextRes = generator.next()
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, callApi(effects.BUY_PRODUCTS, cart))

  nextRes = generator.next()
  t.equal(nextRes.done, false)
  t.deepEqual(nextRes.value, actions.checkoutSuccess(cart))

  nextRes = generator.next()
  t.equal(nextRes.done, true)

  t.end()

});
