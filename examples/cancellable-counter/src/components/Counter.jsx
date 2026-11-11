import { useDispatch, useSelector } from 'react-redux'

import { INCREMENT, DECREMENT, INCREMENT_IF_ODD, INCREMENT_ASYNC, CANCEL_INCREMENT_ASYNC } from '../actionTypes'

export default function Counter() {
  const counter = useSelector((state) => state.counter)
  const countdown = useSelector((state) => state.countdown)
  const dispatch = useDispatch()
  const action = (type, value) => () => dispatch({ type, value })

  return (
    <div>
      Clicked: {counter} times <button onClick={action(INCREMENT)}>+</button>{' '}
      <button onClick={action(DECREMENT)}>-</button>{' '}
      <button onClick={action(INCREMENT_IF_ODD)}>Increment if odd</button>{' '}
      <button
        onClick={countdown ? action(CANCEL_INCREMENT_ASYNC) : action(INCREMENT_ASYNC, 5)}
        style={{ color: countdown ? 'red' : 'black' }}
      >
        {countdown ? `Cancel increment (${countdown})` : 'increment after 5s'}
      </button>
    </div>
  )
}
