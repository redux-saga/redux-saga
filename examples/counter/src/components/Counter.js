import React, { Component, PropTypes } from 'react'

class Counter extends Component {
  render() {
    const { increment, incrementIfOdd, incrementAsync, decrement, hideCongratulation, cancelIncrementAsync,
            counter, incrementAsyncPending, congratulate } = this.props

    const congratulationMsg = congratulate ?
      (<div>
        Congratulations!
        <button onClick={hideCongratulation}>Dismiss</button>
      </div>) : null

    return (
      <div>
        <p>
          Clicked: {counter} times
          {' '}
          <button onClick={increment}>+</button>
          {' '}
          <button onClick={decrement}>-</button>
          {' '}
          <button onClick={incrementIfOdd}>Increment if odd</button>
          {' '}
          <button
            onClick={incrementAsyncPending ? cancelIncrementAsync : incrementAsync}
            style={{color: incrementAsyncPending ? 'red' : 'black'}}>

            {incrementAsyncPending ? 'Cancel increment' : 'increment after 1s'}
          </button>
        </p>
        { congratulationMsg }
      </div>
    )
  }
}

Counter.propTypes = {
  increment: PropTypes.func.isRequired,
  incrementIfOdd: PropTypes.func.isRequired,
  incrementAsync: PropTypes.func.isRequired,
  cancelIncrementAsync: PropTypes.func.isRequired,
  decrement: PropTypes.func.isRequired,
  hideCongratulation: PropTypes.func.isRequired,
  counter: PropTypes.number.isRequired,
  incrementAsyncPending: PropTypes.bool.isRequired,
  congratulate: PropTypes.bool.isRequired
}

export default Counter
