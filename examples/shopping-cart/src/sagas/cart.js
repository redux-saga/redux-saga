import * as types from '../constants/ActionTypes'
import { API_CALL } from '../constants/EffectTypes'
import { receiveProducts, checkoutSuccess } from '../actions'

export default function(state, action) {

  switch (action.type) {
    case types.GET_ALL_PRODUCTS:
      return [{
        type: API_CALL,
        endpoint: 'getProducts',
        args: [],
        actionSuccess: receiveProducts
      }]
    case types.CHECKOUT_REQUEST:
      return [{
        type: API_CALL,
        endpoint: 'buyProducts',
        payload: state.cart,
        actionSuccess: checkoutSuccess,
        args: [state.cart]
      }]
    default:
      return [];
  }
}
