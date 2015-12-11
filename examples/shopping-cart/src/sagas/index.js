
import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'
import { nextAction } from '../../../../src'


function* getAllProducts() {
  while(true) {
    yield nextAction(types.GET_ALL_PRODUCTS)
    const products = yield api.getProducts
    yield actions.receiveProducts(products)
  }
}

function* checkout(getState) {
  while(true) {
    yield nextAction(types.CHECKOUT_REQUEST)
    const cart = getState().cart
    try {
      yield [api.buyProducts, cart]
      yield actions.checkoutSuccess(cart)
    } catch(error) {
      yield actions.checkoutFailure(error)
    }
  }
}

export default [getAllProducts, checkout]
