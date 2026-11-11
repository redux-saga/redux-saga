import { useDispatch, useSelector } from 'react-redux'
import CartItem from './CartItem'
import { checkout, removeFromCart } from '../actions'
import { getTotal, getCartProducts, getCheckoutError, isCheckoutPending } from '../reducers'

export default function Cart() {
  const products = useSelector(getCartProducts)
  const total = useSelector(getTotal)
  const error = useSelector(getCheckoutError)
  const checkoutPending = useSelector(isCheckoutPending)
  const dispatch = useDispatch()

  const hasProducts = products.length > 0
  const checkoutAllowed = hasProducts && !checkoutPending

  const nodes = !hasProducts ? (
    <em>Please add some products to cart.</em>
  ) : (
    products.map((product) => (
      <CartItem
        title={product.title}
        price={product.price}
        quantity={product.quantity}
        key={product.id}
        onRemove={() => dispatch(removeFromCart(product.id))}
      />
    ))
  )

  return (
    <div>
      <h3>Your Cart</h3>
      <div>{nodes}</div>
      <p>Total: &#36;{total}</p>
      <button onClick={() => dispatch(checkout())} disabled={!checkoutAllowed}>
        Checkout
      </button>
      <div style={{ color: 'red' }}>{error}</div>
    </div>
  )
}
