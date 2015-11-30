
import * as types from '../constants/ActionTypes'
import { API_CALL, GET_PRODUCTS, BUY_PRODUCTS } from '../constants/ServiceTypes'
import { receiveProducts, checkoutSuccess } from '../actions'

export function callApi(endpoint, payload) {
  return { [API_CALL] : { endpoint, payload } }
}

function* getAllProducts() {

  const products = yield callApi(GET_PRODUCTS)
  yield receiveProducts(products)

}

function* checkout(getState) {
  const cart = getState().cart

  yield callApi(BUY_PRODUCTS, cart)
  yield checkoutSuccess(cart)

}

export default function(state, action) {

  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      return getAllProducts

    case types.CHECKOUT_REQUEST:
      return checkout
  }
}
