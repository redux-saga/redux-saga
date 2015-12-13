import test from 'tape'

import io from '../../../src/io'
import sagas from '../src/sagas'
import { api } from '../src/services'
import * as types from '../src/constants/ActionTypes'
import * as actions from '../src/actions'

const [getProductsSaga, checkoutSaga] = sagas
const products = [1], cart = [1] // dummy values
const state = { products, cart }
const getState = () => state

test('getProducts Saga test', function (t) {

  const generator = getProductsSaga(io, getState)

  let next = generator.next()
  t.deepEqual(next.value, io.take(types.GET_ALL_PRODUCTS),
    "Must wait for next GET_ALL_PRODUCTS action"
  )

  next = generator.next(actions.getAllProducts())
  t.deepEqual(next.value, io.call(api.getProducts),
    "must yield api.getProducts"
  )

  next = generator.next(products)
  t.deepEqual(next.value, io.put(actions.receiveProducts(products)),
    "must yield actions.receiveProducts(products)"
  )

  t.end()

})


test('checkout Saga test', function (t) {


  const generator = checkoutSaga(io, getState)

  let next = generator.next()
  t.deepEqual(next.value, io.take(types.CHECKOUT_REQUEST),
    "Must wait for next CHECKOUT_REQUEST action"
  )

  next = generator.next(actions.checkout(products))
  t.deepEqual(next.value, io.call(api.buyProducts, cart),
    "must call api.buyProducts(cart)"
  )

  next = generator.next()
  t.deepEqual(next.value, io.put(actions.checkoutSuccess(cart)),
    "must yield actions.checkoutSuccess(cart)"
  )

  t.end()
})
