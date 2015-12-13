/* eslint-disable no-constant-condition */

import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'

function* getAllProducts(io) {
  while( yield io.take(types.GET_ALL_PRODUCTS) ) {
    const products = yield io.call(api.getProducts)
    yield io.put(actions.receiveProducts(products))
  }
}

function* checkout(io, getState) {

  while( yield io.take(types.CHECKOUT_REQUEST) ) {
    try {
      const cart = getState().cart
      yield io.call(api.buyProducts, cart)
      yield io.put(actions.checkoutSuccess(cart))
    } catch(error) {
      yield io.put(actions.checkoutFailure(error))
    }
  }
}

export default [getAllProducts, checkout]
