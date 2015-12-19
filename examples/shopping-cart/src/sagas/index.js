/* eslint-disable no-constant-condition */

import { take, put, call } from '../../../../src'
import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'

function* getAllProducts() {
  while( yield take(types.GET_ALL_PRODUCTS) ) {
    const products = yield call(api.getProducts)
    yield put(actions.receiveProducts(products))
  }
}

function* checkout(getState) {

  while( yield take(types.CHECKOUT_REQUEST) ) {
    try {
      const cart = getState().cart
      yield call(api.buyProducts, cart)
      yield put(actions.checkoutSuccess(cart))
    } catch(error) {
      yield put(actions.checkoutFailure(error))
    }
  }
}

function* startup() {
  yield put(actions.getAllProducts())
}

export default [getAllProducts, checkout, startup]
