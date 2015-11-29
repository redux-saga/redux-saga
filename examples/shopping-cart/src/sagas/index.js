
import cart from './cart'

const rootSaga = (state, action) => {
  return cart(state, action)
}

export default rootSaga
