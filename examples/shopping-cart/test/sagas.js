import test from 'tape'

import { asNextAction } from '../../../src'
import sagas from '../src/sagas'
import { api } from '../src/services'
import * as types from '../src/constants/ActionTypes'
import * as actions from '../src/actions'

const [getProductsSaga, checkoutSaga] = sagas
const products = [1], cart = [1] // dummy values
const state = { products, cart }
const getState = () => state

test('getProducts Saga test', function (t) {

  const generator = getProductsSaga(getState)

  let next = asNextAction( generator.next().value )
  t.equal(next, types.GET_ALL_PRODUCTS,
    "Must wait for next GET_ALL_PRODUCTS action"
  )

  next = generator.next(actions.getAllProducts()).value
  t.deepEqual(next, api.getProducts,
    "must yield api.getProducts"
  )

  next = generator.next(products).value
  t.deepEqual(next, actions.receiveProducts(products),
    "must yield actions.receiveProducts(products)"
  )

  t.end()

})


test('checkout Saga test', function (t) {


  const generator = checkoutSaga(getState)

  let next = asNextAction( generator.next().value )
  t.equal(next, types.CHECKOUT_REQUEST,
    "Must wait for next CHECKOUT_REQUEST action"
  )

  let next = generator.next(actions.checkout(products))
  t.deepEqual(next.value, [api.buyProducts, cart],
    "must yield [api.buyProducts, cart]"
  )

  next = generator.next()
  t.deepEqual(next.value, actions.checkoutSuccess(cart),
    "must yield actions.checkoutSuccess(cart)"
  )

  t.end()
})
