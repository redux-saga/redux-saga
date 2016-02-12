/*eslint-disable no-unused-vars*/
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import {
  INCREMENT,
  DECREMENT,
  INCREMENT_IF_ODD,
  INCREMENT_ASYNC,
  CANCEL_INCREMENT_ASYNC,
  HIDE_CONGRATULATION
} from '../actionTypes'


function Counter({counter, incrementAsyncPending, congratulate, dispatch}) {

      const action = type => () => dispatch({type})

      const congratulationMsg = (
        congratulate
          ? <div>
              Congratulations!
              <button onClick={action(HIDE_CONGRATULATION)}>Dismiss</button>
            </div>
          : null
      )

      return (
        <div>
          <p>
            Clicked: {counter} times
            {' '}
            <button onClick={action(INCREMENT)}>+</button>
            {' '}
            <button onClick={action(DECREMENT)}>-</button>
            {' '}
            <button onClick={action(INCREMENT_IF_ODD)}>Increment if odd</button>
            {' '}
            <button
              onClick={incrementAsyncPending ? action(CANCEL_INCREMENT_ASYNC) : action(INCREMENT_ASYNC)}
              style={{color: incrementAsyncPending ? 'red' : 'black'}}>

              {incrementAsyncPending ? 'Cancel increment' : 'increment after 1s'}
            </button>
          </p>
          { congratulationMsg }
        </div>
      )
}



Counter.propTypes = {
  // dispatch actions
  dispatch: PropTypes.func.isRequired,
  // state
  counter: PropTypes.number.isRequired,
  incrementAsyncPending: PropTypes.bool.isRequired,
  congratulate: PropTypes.bool.isRequired
}

function mapStateToProps(state) {
  return {
    counter: state.counter,
    congratulate: state.congratulate,
    incrementAsyncPending: state.incrementAsyncPending
  }
}

export default connect(mapStateToProps)(Counter)
