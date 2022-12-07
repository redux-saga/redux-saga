import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import styles from '../pages/styles.module.css'

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

Feature.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
}

export default Feature
