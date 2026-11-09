export default function Counter({ value, onIncrement, onIncrementAsync, onDecrement, onIncrementIfOdd }) {
  return (
    <p>
      Clicked: {value} times <button onClick={onIncrement}>+</button> <button onClick={onDecrement}>-</button>{' '}
      <button onClick={onIncrementIfOdd}>Increment if odd</button>{' '}
      <button onClick={onIncrementAsync}>Increment async</button>
    </p>
  )
}
