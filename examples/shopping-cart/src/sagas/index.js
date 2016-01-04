/* eslint-disable no-constant-condition */

import { take, put, call, fork } from '../../../../src'
import * as types from '../constants/ActionTypes'
import * as actions from '../actions'
import { api } from '../services'

export function* getAllProducts() {
  while( yield take(types.GET_ALL_PRODUCTS) ) {
    const products = yield call(api.getProducts)
    yield put(actions.receiveProducts(products))
  }
}

export function* checkout(getState) {

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

export function* startup() {
  yield put( actions.getAllProducts() )
}

export default function* root(getState) {
  yield fork(getAllProducts)
  yield fork(checkout, getState)
  yield fork(startup)
}
