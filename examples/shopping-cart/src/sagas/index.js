/* eslint-disable no-constant-condition */

import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'

function* getAllProducts(io) {
  while(true) {
    yield io.wait(types.GET_ALL_PRODUCTS)
    const products = yield api.getProducts
    yield io.action(actions.receiveProducts(products))
  }
}

function* checkout(io, getState) {
  while(true) {
    yield io.wait(types.CHECKOUT_REQUEST)
    const cart = getState().cart
    try {
      yield io.call(api.buyProducts, cart)
      yield io.action(actions.checkoutSuccess(cart))
    } catch(error) {
      yield io.action(actions.checkoutFailure(error))
    }
  }
}

export default [getAllProducts, checkout]
