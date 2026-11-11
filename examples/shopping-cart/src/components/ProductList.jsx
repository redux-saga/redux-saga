import { useDispatch, useSelector } from 'react-redux'
import ProductItem from './ProductItem'
import { addToCart } from '../actions'
import { getVisibleProducts } from '../reducers/products'

export default function ProductList() {
  const products = useSelector((state) => getVisibleProducts(state.products))
  const dispatch = useDispatch()

  return (
    <div>
      <h3>Products</h3>
      {products.map((product) => (
        <ProductItem key={product.id} product={product} onAddToCartClicked={() => dispatch(addToCart(product.id))} />
      ))}
    </div>
  )
}
