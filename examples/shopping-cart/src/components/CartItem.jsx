import Product from './Product'

export default function CartItem({ price, quantity, title, onRemove }) {
  return (
    <Product price={price} quantity={quantity} title={title} action={<button onClick={onRemove}>{' X '}</button>} />
  )
}
