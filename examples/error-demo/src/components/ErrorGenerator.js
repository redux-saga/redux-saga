/*eslint-disable no-unused-vars */
import React, { PropTypes } from 'react'

const ErrorGenerator = ({ action }) =>
      <p>
        <button onClick={() => action('ACTION_ERROR_IN_PUT')}>
          Action error in put
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_SELECT')}>
          Action error in select
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_CALL_SYNC')}>
          Action error in call sync
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_CALL_ASYNC')}>
          Action error in call async
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_CALL_INLINE')}>
          Action error in call inline
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_FORK')}>
          Action error in fork
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_SPAWN')}>
          Action error in spawn
        </button>
        {' '}
        <button onClick={() => action('ACTION_ERROR_IN_RACE')}>
          Action error in race
        </button>
        {' '}
        <button onClick={() => action('ACTION_CAUGHT_ERROR')}>
          Action caught error
        </button>
        {' '}
        <button onClick={() => action('ACTION_INLINE_SAGA_ERROR')}>
          Action error in inlined saga
        </button>
      </p>

ErrorGenerator.propTypes = {
  action: PropTypes.func.isRequired,
}

export default ErrorGenerator
