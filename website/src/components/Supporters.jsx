import React from 'react'
import PropTypes from 'prop-types'

const BACKER_COUNT = 30
const SPONSOR_COUNT = 30

function Supporters({ type }) {
  const COUNT = type === 'backer' ? BACKER_COUNT : SPONSOR_COUNT

  if (type !== 'backer' && type !== 'sponsor') {
    throw new Error('Invalid supporter type')
  }

  const supporters = Array.from({ length: COUNT }).map((v, i) => (
    // Ok to use index as key here, elements will not change
    <a
      key={i}
      href={`https://opencollective.com/redux-saga/${type}/${i}/website`}
      className={type + ' supporter col'}
      target="_blank"
      rel="noreferrer noopener"
    >
      <img src={`https://opencollective.com/redux-saga/${type}/${i}/avatar.svg`} />
    </a>
  ))

  return <>{supporters}</>
}

Supporters.propTypes = {
  type: PropTypes.string,
}

export default Supporters
