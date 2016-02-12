/*eslint-disable no-unused-vars */
import React, { Component, PropTypes } from 'react'

const Counter = ({ value, onIncrement, onIncrementAsync, onDecrement, onIncrementIfOdd }) =>
      <p>
        Clicked: {value} times
        {' '}
        <button onClick={onIncrement}>
          +
        </button>
        {' '}
        <button onClick={onDecrement}>
          -
        </button>
        {' '}
        <button onClick={onIncrementIfOdd}>
          Increment if odd
        </button>
        {' '}
        <button onClick={onIncrementAsync}>
          Increment async
        </button>
      </p>

Counter.propTypes = {
  value: PropTypes.number.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
  onIncrementAsync: PropTypes.func.isRequired,
  onIncrementIfOdd: PropTypes.func.isRequired
}

export default Counter
