
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

export default function* rootsaga(getState, action) {

  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      yield* getAllProducts(getState)
      break

    case types.CHECKOUT_REQUEST:
      yield* checkout(getState)
  }
}
