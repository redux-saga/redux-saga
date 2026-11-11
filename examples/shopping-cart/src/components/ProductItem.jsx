import Product from './Product'

export default function ProductItem({ product, onAddToCartClicked }) {
  const addToCartAction = (
    <button onClick={onAddToCartClicked} disabled={product.inventory <= 0}>
      {product.inventory > 0 ? 'Add to cart' : 'Sold Out'}
    </button>
  )

  return (
    <div style={{ marginBottom: 20 }}>
      <Product title={product.title} price={product.price} action={addToCartAction} />
    </div>
  )
}
