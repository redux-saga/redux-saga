import test from 'tape'

import saga from '../src/sagas'
import { api } from '../src/services'
import * as actions from '../src/actions'

const products = [1], cart = [1] // dummy values
const state = { products, cart }
const getState = () => state

test('getProducts Saga test', function (t) {

  const generator = saga( getState, actions.getAllProducts() )

  let next = generator.next()
  t.deepEqual(next.value, [api.getProducts],
    "must yield effect [api.getProducts]"
  )

  next = generator.next(products)
  t.deepEqual(next.value, actions.receiveProducts(products),
    "must yield actions.receiveProducts(products)"
  )

  next = generator.next()
  t.equal(next.done, true, "must be done")

  t.end()

})


test('checkout Saga test', function (t) {


  const generator = saga(getState, actions.checkout(products))

  let next = generator.next()
  t.deepEqual(next.value, [api.buyProducts, cart],
    "must yield [api.buyProducts, cart]"
  )

  next = generator.next()
  t.deepEqual(next.value, actions.checkoutSuccess(cart),
    "must yield actions.checkoutSuccess(cart)"
  )

  next = generator.next()
  t.equal(next.done, true, "must be done")

  t.end()
})
