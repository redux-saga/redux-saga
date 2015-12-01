
import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'


function* getAllProducts() {
  const products = yield [api.getProducts]
  yield actions.receiveProducts(products)

}

function* checkout(getState) {
  const cart = getState().cart

  try {
    yield [api.buyProducts, cart]
    yield actions.checkoutSuccess(cart)
  } catch(error) {
    yield actions.checkoutFailure(error)
  }
}

export default function* rootSaga(getState, action) {

  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      yield* getAllProducts(getState)
      break

    case types.CHECKOUT_REQUEST:
      yield* checkout(getState)
  }
}
