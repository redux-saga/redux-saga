
import * as types from '../constants/ActionTypes'
import * as actions from '../actions'

export default function rootSagaFactory(api) {

  function* getAllProducts() {
    const products = yield api.getProducts()
    yield actions.receiveProducts(products)

  }

  function* checkout(getState) {
    const cart = getState().cart

    try {
      yield api.buyProducts(cart)
      yield actions.checkoutSuccess(cart)
    } catch(error) {
      yield actions.checkoutFailure(error)
    }
  }

  return function* rootSaga(getState, action) {

    switch (action.type) {
      case types.GET_ALL_PRODUCTS:
        yield* getAllProducts(getState)
        break

      case types.CHECKOUT_REQUEST:
        yield* checkout(getState)
    }
  }

}
