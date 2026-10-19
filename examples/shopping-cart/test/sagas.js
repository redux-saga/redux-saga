import { test, expect } from 'vitest'

import { put, call, select } from 'redux-saga/effects'
import { getAllProducts, checkout } from '../src/sagas'
import { api } from '../src/services'
import * as actions from '../src/actions'
import { getCart } from '../src/reducers'

const products = [1],
  cart = [1] // dummy values
const state = { products, cart }
const getState = () => state

test('getProducts Saga test', () => {
  const generator = getAllProducts(getState)

  let next = generator.next(actions.getAllProducts())
  expect(next.value, 'must yield api.getProducts').toEqual(call(api.getProducts))

  next = generator.next(products)
  expect(next.value, 'must yield actions.receiveProducts(products)').toEqual(put(actions.receiveProducts(products)))
})

test('checkout Saga test', () => {
  const generator = checkout()

  let next = generator.next()
  expect(next.value, 'must select getCart').toEqual(select(getCart))

  next = generator.next(cart)
  expect(next.value, 'must call api.buyProducts(cart)').toEqual(call(api.buyProducts, cart))

  next = generator.next()
  expect(next.value, 'must yield actions.checkoutSuccess(cart)').toEqual(put(actions.checkoutSuccess(cart)))
})
