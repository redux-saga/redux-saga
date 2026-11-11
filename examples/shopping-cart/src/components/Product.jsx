export default function Product({ price, quantity, title, action }) {
  return (
    <div>
      {title} - &#36;{price} {quantity ? `x ${quantity}` : null} {action}
    </div>
  )
}
