import shop from '../api/shop'
import * as types from '../constants/ActionTypes'

export function getAllProducts() {
  return {
    type: types.GET_ALL_PRODUCTS
  }
}

export function receiveProducts(products) {
  return {
    type: types.RECEIVE_PRODUCTS,
    products: products
  }
}

export function addToCart(productId) {
  return {
    type: types.ADD_TO_CART,
    productId
  }
}

export function checkout(products) {
  return {
    type: types.CHECKOUT_REQUEST,
    products: products
  }
}

export function checkoutSuccess(cart) {
  return {
    type: types.CHECKOUT_SUCCESS,
    cart
  }
}

export function checkoutFailure(cart) {
  return {
    type: types.CHECKOUT_FAILURE,
    cart
  }
}
