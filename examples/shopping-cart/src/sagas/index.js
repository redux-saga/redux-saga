/* eslint-disable no-constant-condition */

import { takeEvery } from '../../../../src'
import { take, put, call, fork } from '../../../../src/effects'
import * as actions from '../actions'
import { api } from '../services'

export function* getAllProducts() {
  const products = yield call(api.getProducts)
  yield put(actions.receiveProducts(products))
}

export function* checkout(getState) {
    try {
      const cart = getState().cart
      yield call(api.buyProducts, cart)
      yield put(actions.checkoutSuccess(cart))
    } catch(error) {
      yield put(actions.checkoutFailure(error))
    }
}

export function* watchGetProducts(getState) {
  /*
    takeEvery will fork a new `checkout` task on each GET_ALL_PRODUCTS actions
    i.e. concurrent GET_ALL_PRODUCTS actions are allowed
  */
  yield* takeEvery(actions.GET_ALL_PRODUCTS, getAllProducts, getState)
}

export function* watchCheckout(getState) {
  while(true) {
    yield take(actions.CHECKOUT_REQUEST)
    /*
      ***THIS IS A BLOCKING CALL***
      It means that watchCheckout will ignore any CHECKOUT_REQUEST event until
      the current checkout completes, either by success or by Error.
      i.e. concurrent CHECKOUT_REQUEST are not allowed
      TODO: This needs to be enforced by the UI (disable checkout button)
    */
    yield call(checkout, getState)
  }
}

export default function* root(getState) {
  yield [
    fork(getAllProducts),
    fork(watchGetProducts, getState),
    fork(watchCheckout, getState)
  ]
}
