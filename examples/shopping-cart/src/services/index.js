/**
 * Mocking client-server processing
 */
import _products from './products.json'

const TIMEOUT = 100
const MAX_CHECKOUT = 2 // max different items

export const api = {
  getProducts() {
    return new Promise( resolve =>
      setTimeout(() => resolve(_products), TIMEOUT)
    )
  },

  buyProducts(cart) {
    return new Promise( (resolve, reject) =>
        setTimeout(() => {
          if(cart.addedIds.length <= MAX_CHECKOUT)
            resolve(cart)
          else
            reject(`You can buy ${MAX_CHECKOUT} items at maximum in a checkout`)
        }, TIMEOUT)
    )
  }
}
