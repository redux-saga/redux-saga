/**
 * Mocking client-server processing
 */
import _products from './products.json'

const TIMEOUT = 100

export default {
  getProducts() {
    return new Promise( resolve =>
      setTimeout(() => resolve(_products), TIMEOUT)
    )
  },

  buyProducts(payload) {
    return new Promise( resolve =>
        setTimeout(() => resolve(true), TIMEOUT)
    )
  }
}
